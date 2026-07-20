/**
 * The orchestrator: machine ↔ proxy ↔ store. Everything bounded lives in the pure modules —
 * this hook only wires them together and owns the network edge.
 *
 * Persistence split (AGENT_SPEC §2, decided): draft / affirmed / rawAnswers sync to the
 * store (on-device). The transcript and the stages live and die in memory — the stages are
 * the model's read of a conversation that never touches disk.
 *
 * Failure is a feature: any non-200, timeout, or unparsable body sets 'unavailable' and
 * the manual path keeps working untouched. A failed call never consumes a turn.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { buildNarrativeContext } from '../../../agent/context'
import {
  canCommit,
  initialConversation,
  needsReplacementConfirm,
  nextAction,
  nextDirective,
  reduceConversation,
  type ConversationState,
} from '../../../agent/machine'
import { parseAgentTurn, type AgentRequest, type AgentTurn } from '../../../agent/turns'
import type { DraftIncident, RawAnswers } from '../../draft'
import { useAppStore } from '../../storeContext'

export type NetworkPhase = 'idle' | 'working' | 'unavailable'

export function useNarrativeAssistant(incident: DraftIncident) {
  const { dispatch: storeDispatch, config } = useAppStore()
  const [state, dispatch] = useReducer(
    reduceConversation,
    incident.narrative.draft,
    initialConversation,
  )
  const [network, setNetwork] = useState<NetworkPhase>('idle')
  const [pendingReplacement, setPendingReplacement] = useState<{
    turn: AgentTurn
    directive: 'converse' | 'draft_now'
  } | null>(null)
  const inFlight = useRef(false)

  // ── one-way sync: machine → store (draft + affirmation). Never messages, never stages. ──
  const { account, affirmed } = state
  useEffect(() => {
    storeDispatch({
      type: 'update-incident',
      id: incident.id,
      patch: {
        narrative: {
          rawAnswers: incident.narrative.rawAnswers,
          draft: account,
          affirmed,
        },
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rawAnswers flow store→context directly
  }, [account, affirmed, incident.id, storeDispatch])

  const updateRawAnswers = (patch: Partial<RawAnswers>) =>
    storeDispatch({
      type: 'update-incident',
      id: incident.id,
      patch: {
        narrative: { ...incident.narrative, rawAnswers: { ...incident.narrative.rawAnswers, ...patch } },
      },
    })

  const callProxy = useCallback(
    async (initialAfterState: ConversationState, initialWriteItNow = false) => {
      if (inFlight.current) return
      inFlight.current = true
      setNetwork('working')
      let afterState = initialAfterState
      let writeItNow = initialWriteItNow
      try {
        for (;;) {
        const directive = nextDirective(afterState, { writeItNow })
        const request: AgentRequest = {
          context: buildNarrativeContext(incident),
          messages: afterState.messages,
          directive,
          alreadyNudged: afterState.nudgedFactors,
          skippedStages: afterState.skippedStages,
          // state-published guidance, injected from config — the server is state-agnostic
          guidance: {
            factorsQuote: config.storyFactors.quote,
            factorsCite: config.storyFactors.cite,
          },
        }
        const res = await fetch('/api/narrative', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
        })
        if (!res.ok) {
          setNetwork('unavailable')
          return
        }
        const body = (await res.json()) as { turn?: unknown }
        const turn = parseAgentTurn(body.turn)
        if (!turn) {
          setNetwork('unavailable')
          return
        }
        if (needsReplacementConfirm(afterState, turn)) {
          // Their edit is not overwritten without an explicit yes (§5, decided).
          setPendingReplacement({ turn, directive })
          setNetwork('idle')
          return
        }
        dispatch({ type: 'model-turn', turn, directive })
        setNetwork('idle')

        // ── ALL drafting policy lives in the machine. Consulted only after model turns;
        //    "Write it now" is the explicit exit and never passes through here twice. ──
        const applied = reduceConversation(afterState, { type: 'model-turn', turn, directive })
        const action = nextAction(applied)
        if (action === 'ownership_check') {
          // Code-authored, deterministic, once per incident. Not a model call.
          dispatch({ type: 'ownership-check-shown', text: config.copy.ownershipCheck })
          return
        }
        if (action === 'escalate_draft') {
          // The gate opened and the model still didn't draft — force it: one more pass
          // with draft_now. Iteration, not recursion.
          afterState = applied
          writeItNow = true
          setNetwork('working')
          continue
        }
        return
        }
      } catch {
        setNetwork('unavailable')
      } finally {
        inFlight.current = false
      }
    },
    [incident, config],
  )

  const send = (text: string) => {
    const after = reduceConversation(state, { type: 'user-sent', text })
    dispatch({ type: 'user-sent', text })
    void callProxy(after)
  }

  const skip = () => {
    const after = reduceConversation(state, { type: 'user-skipped' })
    dispatch({ type: 'user-skipped' })
    void callProxy(after)
  }

  const writeItNow = () => {
    void callProxy(state, true)
  }

  const acceptReplacement = () => {
    if (pendingReplacement) dispatch({ type: 'model-turn', ...pendingReplacement })
    setPendingReplacement(null)
  }

  const declineReplacement = () => {
    // The reply still lands; only the overwrite is refused.
    if (pendingReplacement)
      dispatch({
        type: 'model-turn',
        turn: { ...pendingReplacement.turn, draft: null },
        directive: pendingReplacement.directive,
      })
    setPendingReplacement(null)
  }

  return {
    state,
    network,
    pendingReplacement: pendingReplacement?.turn ?? null,
    canCommit: canCommit(state),
    send,
    skip,
    writeItNow,
    retry: () => setNetwork('idle'),
    acceptReplacement,
    declineReplacement,
    editAccount: (text: string) => dispatch({ type: 'user-wrote-account', text }),
    setAffirmed: (value: boolean) => dispatch({ type: 'set-affirmed', value }),
    commit: () => dispatch({ type: 'commit' }),
    updateRawAnswers,
  }
}
