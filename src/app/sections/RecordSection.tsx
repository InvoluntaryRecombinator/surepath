/**
 * Your record — the transcription groove (PRD Stage 4). Facts only; stories come later.
 *
 * Two doors, one structure: an incident (one arrest, several charges) and a single
 * conviction are the same tree — a standalone conviction is an incident with one charge.
 * The UI never says so; it just opens the same card.
 *
 * The inheritance guard (A12): incident fields live ONCE on the card; each charge's
 * exactOffense and sentence render empty, required, no default, no pre-fill.
 *
 * There is no age filter, no lookback, no "probably too old to matter" hint. Ever. (D1)
 * Deferred adjudications are captured and reported like convictions. (D2)
 */
import { Button } from '../../ui/Button'
import { ChoiceField, TextField } from '../../ui/Field'
import { FaqPanel } from '../../ui/FaqPanel'
import { SectionIntro } from '../../ui/SectionIntro'
import type { DraftCharge, DraftIncident } from '../draft'
import { useAppStore } from '../store'

function ChargeRow({
  incident,
  charge,
  ordinal,
  removable,
}: {
  incident: DraftIncident
  charge: DraftCharge
  ordinal: number
  removable: boolean
}) {
  const { dispatch, config } = useAppStore()
  const patch = (p: Partial<DraftCharge>) =>
    dispatch({ type: 'update-charge', incidentId: incident.id, chargeId: charge.id, patch: p })

  return (
    /* Nesting device: indent + one left rule. Not a box in a box. */
    <div className="flex flex-col gap-4 border-l-2 border-line pl-5">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-muted">
          {config.copy.chargeNoun} {ordinal}
        </span>
        {removable && (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'remove-charge', incidentId: incident.id, chargeId: charge.id })
            }
            className="text-[12.5px] font-medium text-muted underline underline-offset-2 hover:text-ink"
          >
            Remove
          </button>
        )}
      </div>

      <TextField
        label="Exact offense, as your court records name it"
        required
        value={charge.exactOffense}
        onChange={(e) => patch({ exactOffense: e.target.value })}
        placeholder="e.g. Possession of a Controlled Substance, Penalty Group 1, less than 1 gram"
        info={
          <>
            The full offense name from the court paperwork — not shorthand like "drug charge."
            If several charges came from this arrest, each one gets its own entry here, with
            its own exact name.
          </>
        }
      />

      <TextField
        label="Sentence or action imposed by the court"
        required
        value={charge.sentence}
        onChange={(e) => patch({ sentence: e.target.value })}
        placeholder="e.g. 6 months county jail; $1,500 fine (paid)"
      />

      <ChoiceField
        label="How it was resolved"
        required
        name={`disposition-${charge.id}`}
        value={charge.disposition}
        onChange={(v) => patch({ disposition: v as DraftCharge['disposition'] })}
        options={[
          { value: 'conviction', label: 'Conviction' },
          { value: 'deferred_adjudication', label: 'Deferred adjudication' },
        ]}
        info={
          <>
            A deferred adjudication is listed exactly like a conviction — {config.agency}{' '}
            requires it even though it is not technically a conviction. This choice only
            changes how we label it for you; it is always included.
          </>
        }
      />
    </div>
  )
}

function IncidentCard({ incident, ordinal }: { incident: DraftIncident; ordinal: number }) {
  const { dispatch, config } = useAppStore()
  const patch = (p: Partial<DraftIncident>) =>
    dispatch({ type: 'update-incident', id: incident.id, patch: p })

  const summary = [incident.county && `${incident.county} County`, incident.dateOfConviction]
    .filter(Boolean)
    .join(' · ')

  return (
    <section
      aria-label={`Incident ${ordinal}`}
      className="rounded-[6px] border border-line bg-surface px-7 py-6"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold text-ink">
          Incident {ordinal}
          {summary && <span className="ml-2 font-medium text-muted">{summary}</span>}
        </h2>
        <button
          type="button"
          onClick={() => dispatch({ type: 'remove-incident', id: incident.id })}
          className="text-[12.5px] font-medium text-muted underline underline-offset-2 hover:text-ink"
        >
          Remove incident
        </button>
      </div>

      {/* Incident fields — entered once, shared by every charge from this arrest. */}
      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
        <TextField
          label="County"
          required
          value={incident.county}
          onChange={(e) => patch({ county: e.target.value })}
          placeholder="e.g. Harris"
        />
        <TextField
          label="State"
          required
          value={incident.state}
          onChange={(e) => patch({ state: e.target.value })}
        />
        <div className="col-span-2">
          <TextField
            label="Court"
            required
            value={incident.court}
            onChange={(e) => patch({ court: e.target.value })}
            placeholder="e.g. 178th District Court"
            info={
              <>
                Can't recall which court? {config.agency} suggests calling the county clerk
                (misdemeanors) or the district clerk (felonies) in the county where it
                happened — they can look it up for you.
              </>
            }
          />
        </div>
        <TextField
          label="Date the crime was committed"
          required
          value={incident.dateCrimeCommitted}
          onChange={(e) => patch({ dateCrimeCommitted: e.target.value })}
          placeholder="MM/DD/YYYY"
        />
        <TextField
          label="Date of conviction or deferred adjudication"
          required
          value={incident.dateOfConviction}
          onChange={(e) => patch({ dateOfConviction: e.target.value })}
          placeholder="MM/DD/YYYY"
        />
      </div>

      {/* Charges — the ONLY two fields that differ between charges from one arrest,
          plus the disposition label. Each entered fresh: empty, required, no inherit. */}
      <div className="mt-7 flex flex-col gap-6">
        {incident.charges.map((charge, i) => (
          <ChargeRow
            key={charge.id}
            incident={incident}
            charge={charge}
            ordinal={i + 1}
            removable={incident.charges.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'add-charge', incidentId: incident.id })}
        className="mt-5 text-[14px] font-medium text-accent hover:underline underline-offset-4"
      >
        + Add another {config.copy.chargeNoun} from this arrest
      </button>
    </section>
  )
}

export function RecordSection() {
  const { state, dispatch, config } = useAppStore()
  const section = config.sections.find((s) => s.id === 'record')!
  const incidents = state.draft.incidents

  return (
    <>
      <SectionIntro section={section} />

      {incidents.length === 0 ? (
        <p className="text-[15px] text-muted">{config.copy.recordEmptyInvitation}</p>
      ) : (
        incidents.map((incident, i) => (
          <IncidentCard key={incident.id} incident={incident} ordinal={i + 1} />
        ))
      )}

      {/* Two doors into one room. */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Button variant="secondary" onClick={() => dispatch({ type: 'add-incident' })}>
            + {config.copy.addIncident}
          </Button>
          <p className="text-center text-[12.5px] text-muted">{config.copy.addIncidentHint}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button variant="secondary" onClick={() => dispatch({ type: 'add-single-charge' })}>
            + {config.copy.addSingleCharge}
          </Button>
          <p className="text-center text-[12.5px] text-muted">
            {config.copy.addSingleChargeHint}
          </p>
        </div>
      </div>

      <FaqPanel items={config.recordFaq} agency={config.agency} />
    </>
  )
}
