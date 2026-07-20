/**
 * The conversation state machine (AGENT_SPEC §5). Pure — a reducer over events, no I/O,
 * no timers, no model. The prompt shapes behavior; THIS bounds it:
 *
 *   - MAX_FOLLOWUP_TURNS (14) is a runaway-loop backstop, NOT a hurry-up: nobody sane hits
 *     it, and the prompt pushes resolution long before. At the cap the next directive is
 *     'draft_now' and questions stop rendering.
 *   - THE CONVERSE DRAFT GATE: a volunteered draft is accepted only when `what` and `why`
 *     are covered — or explicitly skipped. A skip waives the gate for that stage: their no
 *     is final, and holding a gate after an explicit skip is interviewing someone against
 *     their will. draft_now (cap or "Write it now") always accepts.
 *   - `stages` come from the model wholesale each turn — code renders and gates, it NEVER
 *     increments a stage itself.
 *   - A factor is nudged at most once, ever. The MANUAL PATH is first-class. Hints never
 *     gate. Save requires the §7 affirmation. Failures don't consume turns.
 */
import type { AgentTurn, NudgeFactor, StageKey, Stages } from './turns'

export const MAX_FOLLOWUP_TURNS = 14

export type ConversationStatus = 'empty' | 'gathering' | 'drafted' | 'committed'

export type Exchange = { role: 'user' | 'assistant'; content: string }

export const emptyStages: Stages = { what: 'empty', why: 'empty', changed: 'empty', right: 'empty' }

export type ConversationState = {
  status: ConversationStatus
  /** Completed model turns. Failures don't count — a network error must not eat a turn. */
  turnCount: number
  nudgedFactors: NudgeFactor[]
  /** Stages the user explicitly skipped. Never re-asked; the draft gate is waived for them. */
  skippedStages: StageKey[]
  /** The model's read of the whole conversation, re-reported every turn. Session-only. */
  stages: Stages
  /** The wire history — exactly what the user saw, so the model's memory matches theirs. */
  messages: Exchange[]
  /** The account. The only thing that ever reaches the packet, and only on commit. */
  account: string
  /** Who last touched the account. A user edit always wins — no rewriting behind them. */
  accountSource: 'manual' | 'model' | null
  /** The §7 affirmation. Reset by every change to the account. */
  affirmed: boolean
  /** The one question currently posed, with its optional reason. */
  pendingFollowUp: { question: string; reason: string | null; stage: StageKey | null } | null
  /** The nudge to render this turn, already deduplicated. */
  pendingNudge: { factor: NudgeFactor; text: string } | null
}

export type ConversationEvent =
  | { type: 'user-wrote-account'; text: string }
  | { type: 'user-sent'; text: string }
  | { type: 'user-skipped' }
  | { type: 'model-turn'; turn: AgentTurn; directive: 'converse' | 'draft_now' }
  | { type: 'set-affirmed'; value: boolean }
  | { type: 'commit' }

export function initialConversation(existingAccount = ''): ConversationState {
  const has = existingAccount.trim().length > 0
  return {
    status: has ? 'drafted' : 'empty',
    turnCount: 0,
    nudgedFactors: [],
    skippedStages: [],
    stages: emptyStages,
    messages: [],
    account: existingAccount,
    accountSource: has ? 'manual' : null,
    affirmed: false,
    pendingFollowUp: null,
    pendingNudge: null,
  }
}

/** What the NEXT request's directive must be. Code decides — never the model. */
export function nextDirective(
  state: ConversationState,
  opts: { writeItNow?: boolean } = {},
): 'converse' | 'draft_now' {
  return opts.writeItNow || state.turnCount >= MAX_FOLLOWUP_TURNS ? 'draft_now' : 'converse'
}

/** The converse gate: what + why covered, unless explicitly skipped. */
export function draftAllowedInConverse(state: ConversationState, stages: Stages): boolean {
  const ok = (k: 'what' | 'why') => stages[k] === 'covered' || state.skippedStages.includes(k)
  return ok('what') && ok('why')
}

export function canCommit(state: ConversationState): boolean {
  return state.status === 'drafted' && state.account.trim().length > 0 && state.affirmed
}

const SKIP_TEXT = "I'd rather skip that."

export function reduceConversation(
  state: ConversationState,
  event: ConversationEvent,
): ConversationState {
  // Committed is terminal for this sitting; reopening is a new conversation.
  if (state.status === 'committed') return state

  switch (event.type) {
    case 'user-wrote-account': {
      const has = event.text.trim().length > 0
      return {
        ...state,
        account: event.text,
        accountSource: 'manual',
        affirmed: false, // any change un-affirms — they confirm what they'll actually sign
        status: has ? 'drafted' : state.messages.length > 0 ? state.status : 'empty',
      }
    }

    case 'user-sent': {
      if (event.text.trim().length === 0) return state
      return {
        ...state,
        status: state.status === 'drafted' ? 'drafted' : 'gathering',
        messages: [...state.messages, { role: 'user', content: event.text }],
        pendingFollowUp: null,
        pendingNudge: null,
      }
    }

    case 'user-skipped': {
      // Their no is final: waive the gate for the probed stage and never re-ask.
      const stage = state.pendingFollowUp?.stage ?? null
      return {
        ...state,
        skippedStages:
          stage && !state.skippedStages.includes(stage)
            ? [...state.skippedStages, stage]
            : state.skippedStages,
        status: state.status === 'drafted' ? 'drafted' : 'gathering',
        messages: [...state.messages, { role: 'user', content: SKIP_TEXT }],
        pendingFollowUp: null,
        pendingNudge: null,
      }
    }

    case 'model-turn': {
      const turn = event.turn
      const turnCount = state.turnCount + 1

      // Nudge: once per factor, EVER. A repeat is dropped before it renders. (§5)
      const nudgeAllowed = turn.nudge !== null && !state.nudgedFactors.includes(turn.nudge.factor)
      const pendingNudge = nudgeAllowed ? turn.nudge : null
      const nudgedFactors = nudgeAllowed
        ? [...state.nudgedFactors, turn.nudge!.factor]
        : state.nudgedFactors

      // The converse gate: a volunteered draft is stripped unless what+why are covered
      // (or skipped). draft_now always accepts — it exists to force.
      const hasDraft = turn.draft !== null && turn.draft.trim().length > 0
      const drafted =
        hasDraft &&
        (event.directive === 'draft_now' || draftAllowedInConverse(state, turn.stages))

      // A question already skipped never renders again; questions stop at the cap and on
      // a landed draft.
      const followUpAllowed =
        !drafted &&
        turnCount < MAX_FOLLOWUP_TURNS &&
        turn.followUp !== null &&
        !(turn.followUp.stage !== null && state.skippedStages.includes(turn.followUp.stage))
      const pendingFollowUp = followUpAllowed ? turn.followUp : null

      // The wire history records exactly what rendered.
      const shown = [
        turn.reply,
        pendingNudge?.text,
        pendingFollowUp ? [pendingFollowUp.question, pendingFollowUp.reason].filter(Boolean).join('\n') : null,
      ]
        .filter((s): s is string => Boolean(s && s.trim()))
        .join('\n\n')

      return {
        ...state,
        turnCount,
        nudgedFactors,
        pendingNudge,
        pendingFollowUp,
        stages: turn.stages, // wholesale, from the model. Code never increments.
        messages: shown ? [...state.messages, { role: 'assistant', content: shown }] : state.messages,
        ...(drafted
          ? {
              account: turn.draft!,
              accountSource: 'model' as const,
              affirmed: false,
              status: 'drafted' as const,
            }
          : { status: state.status === 'drafted' ? ('drafted' as const) : ('gathering' as const) }),
      }
    }

    case 'set-affirmed':
      if (state.status !== 'drafted') return state
      return { ...state, affirmed: event.value }

    case 'commit':
      if (!canCommit(state)) return state
      return { ...state, status: 'committed' }
  }
}

/**
 * The revision-after-manual-edit rule (AGENT_SPEC §5, as decided): a model draft may
 * replace a MANUALLY-edited account only behind an explicit confirm. The orchestrator
 * holds the turn; on decline it dispatches the turn with the draft stripped (the reply
 * still renders — only the overwrite is refused).
 */
export function needsReplacementConfirm(state: ConversationState, turn: AgentTurn): boolean {
  return (
    turn.draft !== null &&
    turn.draft.trim().length > 0 &&
    state.accountSource === 'manual' &&
    state.account.trim().length > 0 &&
    state.account.trim() !== turn.draft.trim()
  )
}
