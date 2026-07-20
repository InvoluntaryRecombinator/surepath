/**
 * The conversation state machine (AGENT_SPEC §5). Pure — a reducer over events, no I/O,
 * no timers, no model. The prompt shapes behavior; THIS bounds it:
 *
 *   - MAX_FOLLOWUP_TURNS is a counter, not an instruction. At the cap the next directive
 *     is 'draft_now' and follow-up questions stop rendering. The model cannot loop.
 *   - A factor is nudged at most once, ever. A repeat nudge is dropped before render.
 *   - The MANUAL PATH is first-class: EMPTY → user writes in the account panel → Save is a
 *     complete, valid path with zero model involvement (and, for free, the API-down mode).
 *   - coverage/readyToDraft are hints. Nothing in here gates on them.
 *   - Save requires the affirmation (§7) — the one layer a clever prompt cannot game.
 *
 * The A6 language check on model strings runs in the ORCHESTRATOR (retry-then-drop),
 * before a turn is dispatched here — by the time an event reaches this reducer it is
 * renderable.
 */
import type { AgentTurn, NudgeFactor } from './turns'

export const MAX_FOLLOWUP_TURNS = 3

export type ConversationStatus = 'empty' | 'gathering' | 'drafted' | 'committed'

export type Exchange = { role: 'user' | 'assistant'; content: string }

export type ConversationState = {
  status: ConversationStatus
  /** Completed model turns. Failures don't count — a network error must not eat a turn. */
  turnCount: number
  nudgedFactors: NudgeFactor[]
  /** The wire history — exactly what the user saw, so the model's memory matches theirs. */
  messages: Exchange[]
  /** Region C. The only thing that ever reaches the packet, and only on commit. */
  account: string
  /** Who last touched the account. A user edit always wins — no rewriting behind them. */
  accountSource: 'manual' | 'model' | null
  /** Model self-report, shown as "worth checking". Transparency, not verification. (§7) */
  assumptions: string[]
  /** The §7 affirmation. Reset by every change to the account. */
  affirmed: boolean
  /** The one question currently posed to the user, if any. */
  pendingFollowUp: string | null
  /** The nudge to render this turn, already deduplicated. */
  pendingNudge: { factor: NudgeFactor; text: string } | null
}

export type ConversationEvent =
  | { type: 'user-wrote-account'; text: string }
  | { type: 'user-sent'; text: string }
  | { type: 'model-turn'; turn: AgentTurn }
  | { type: 'set-affirmed'; value: boolean }
  | { type: 'commit' }

export function initialConversation(existingAccount = ''): ConversationState {
  const has = existingAccount.trim().length > 0
  return {
    status: has ? 'drafted' : 'empty',
    turnCount: 0,
    nudgedFactors: [],
    messages: [],
    account: existingAccount,
    accountSource: has ? 'manual' : null,
    assumptions: [],
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

export function canCommit(state: ConversationState): boolean {
  return state.status === 'drafted' && state.account.trim().length > 0 && state.affirmed
}

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

    case 'model-turn': {
      const turn = event.turn
      const turnCount = state.turnCount + 1

      // Nudge: once per factor, EVER. A repeat is dropped before it renders. (§5)
      const nudgeAllowed = turn.nudge !== null && !state.nudgedFactors.includes(turn.nudge.factor)
      const pendingNudge = nudgeAllowed ? turn.nudge : null
      const nudgedFactors = nudgeAllowed
        ? [...state.nudgedFactors, turn.nudge!.factor]
        : state.nudgedFactors

      // Follow-up: suppressed at the cap, and suppressed when a draft landed — the model
      // hands off conversationally, it does not keep interviewing past its welcome.
      const drafted = turn.draft !== null && turn.draft.trim().length > 0
      const pendingFollowUp =
        !drafted && turnCount < MAX_FOLLOWUP_TURNS ? turn.followUp : null

      // The wire history records exactly what rendered, so the model's memory of the
      // conversation matches the user's.
      const shown = [turn.reply, pendingNudge?.text, pendingFollowUp]
        .filter((s): s is string => Boolean(s && s.trim()))
        .join('\n\n')

      return {
        ...state,
        turnCount,
        nudgedFactors,
        pendingNudge,
        pendingFollowUp,
        messages: shown ? [...state.messages, { role: 'assistant', content: shown }] : state.messages,
        // A draft populates the account and un-affirms; a draftless turn never touches the
        // account — refining conversation cannot erase what's already written.
        ...(drafted
          ? {
              account: turn.draft!,
              accountSource: 'model' as const,
              assumptions: turn.assumptions,
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
