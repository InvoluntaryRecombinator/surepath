/**
 * THE canonical stage list. One source of truth for stage identity — the stepper, the
 * router, and the step-counter line all read from here and nowhere else.
 *
 * Approved 2026-07-14: YOUR TRADE · YOUR INFO · YOUR RECORD · YOUR STORY · LICENSES · REVIEW.
 * Generate is TERMINAL, not a step — you never navigate "back" to it. The interstitials
 * ("What this involves", "Get your record") are un-numbered and live between stages.
 */
export const STAGES = [
  { id: 'trade', rail: 'YOUR TRADE', title: 'Your trade' },
  { id: 'info', rail: 'YOUR INFO', title: 'About you' },
  { id: 'record', rail: 'YOUR RECORD', title: 'Your record' },
  { id: 'story', rail: 'YOUR STORY', title: 'Your story' },
  { id: 'licenses', rail: 'LICENSES', title: 'Choose your licenses' },
  { id: 'review', rail: 'REVIEW', title: 'Review' },
] as const

export type Stage = (typeof STAGES)[number]
export type StageId = Stage['id']

export const stageIndex = (id: StageId): number => STAGES.findIndex((s) => s.id === id)
