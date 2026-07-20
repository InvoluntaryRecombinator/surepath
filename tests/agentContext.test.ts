/**
 * The D6 leak test (TESTING.md §6, AGENT_SPEC §2): serialize the whole context and grep it
 * for the fixture's actual identifier values. Catches a leak no matter what shape it takes,
 * and survives schema changes.
 */
import { describe, expect, it } from 'vitest'
import { buildNarrativeContext } from '../src/agent/context'
import type { DraftIncident } from '../src/app/draft'

const incidentA: DraftIncident = {
  id: 'inc-a',
  county: 'Harris',
  state: 'Texas',
  court: '178th District Court',
  dateCrimeCommitted: '03/14/2019',
  dateOfConviction: '11/02/2019',
  narrative: { rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' }, draft: '', affirmed: false },
  charges: [
    { id: 'c-1', exactOffense: 'Possession of a Controlled Substance, PG1 <1g', sentence: '3 years deferred adjudication', disposition: 'deferred_adjudication' },
    { id: 'c-2', exactOffense: 'Evading Arrest or Detention with a Vehicle', sentence: '2 years state jail, suspended', disposition: 'conviction' },
    { id: 'c-3', exactOffense: 'Resisting Arrest', sentence: '180 days county jail', disposition: 'conviction' },
  ],
}

const incidentB: DraftIncident = {
  ...incidentA,
  id: 'inc-b',
  county: 'Dallas',
  charges: [
    { id: 'c-9', exactOffense: 'Theft of Property, less than $500', sentence: '30 days county jail', disposition: 'conviction' },
  ],
}

// Identifier values as they would exist in the surrounding draft. The builder never receives
// the applicant at all — this test proves the output agrees.
const IDENTIFIERS = [
  'Rivera', 'Marcus', '04/18/1979', '4412 Larkspur', 'Houston', '77021',
  '(713) 555-0148', 'mdrivera79@example.com',
]

describe('buildNarrativeContext — D6', () => {
  const ctx = buildNarrativeContext(incidentA, {
    facts: 'I was pulled over and I ran.',
    why: 'I panicked.',
    whatChanged: 'I finished the court-ordered program in 2020.',
    madeItRight: 'Paid all fines in 2021.',
  })
  const serialized = JSON.stringify(ctx).toLowerCase()

  it('carries NO identifiers. None. Not one.', () => {
    for (const id of IDENTIFIERS) {
      expect(serialized, `LEAKED: ${id}`).not.toContain(id.toLowerCase())
    }
  })

  it('carries EVERY charge from the incident — that is the entire point', () => {
    expect(ctx.charges).toHaveLength(3)
    expect(ctx.charges.map((c) => c.exactOffense)).toEqual(
      incidentA.charges.map((c) => c.exactOffense),
    )
    // disposition rides along — the model needs "deferred adjudication" to write truthfully
    expect(ctx.charges[0].disposition).toBe('deferred_adjudication')
  })

  it('carries NO charge from any OTHER incident', () => {
    expect(serialized).not.toContain(incidentB.charges[0].exactOffense.toLowerCase())
  })

  it('is PURE — same incident in, same context out, and the input is not aliased', () => {
    expect(buildNarrativeContext(incidentA)).toEqual(buildNarrativeContext(incidentA))
    const c = buildNarrativeContext(incidentA)
    c.rawAnswers.facts = 'mutated'
    expect(buildNarrativeContext(incidentA).rawAnswers.facts).toBe('')
  })
})
