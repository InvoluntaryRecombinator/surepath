/**
 * About you — the applicant, collected once, stamped onto every page of the packet.
 *
 * FORM_SPEC note: docs/FORM_SPEC.md is referenced by the brief but absent from the repo;
 * the fields here are built from the verified sources instead — data/tdlr_field_map.json
 * (ENF006 items 1–14, 22–23), ARCHITECTURE §4's Applicant, and PRD Stage 3.
 *
 * THERE IS NO SSN FIELD. There will never be an SSN field (D3). The copy explaining why
 * sits exactly where the SSN would be — that absence, explained, is a trust moment, not
 * a gap.
 *
 * The business branch is hidden behind an explicit No/Yes (default No) and written as N/A
 * in the PDF when hidden, ownership radio CLEARED, never selected (A9, F11).
 */
import { ChoiceField, TextField } from '../../ui/Field'
import {
  ConditionalFields,
  DecisionBlock,
  FieldGroup,
  FieldRow,
} from '../../ui/FieldGroup'
import { InfoBubble } from '../../ui/InfoBubble'
import { SelectField } from '../../ui/Select'
import { formatDate, formatPhone, formatZip, US_STATES } from '../lib/format'
import type { DraftApplicant } from '../draft'
import { useAppStore } from '../storeContext'

const OWNERSHIP_OPTIONS = [
  'Sole proprietor',
  'General partnership',
  'Limited liability company (LLC)',
  'Limited liability partnership (LLP)',
  'Corporation',
] as const

const OWNERSHIP_VALUE: Record<string, DraftApplicant['businessOwnership']> = {
  'Sole proprietor': 'sole_proprietor',
  'General partnership': 'general_partnership',
  'Limited liability company (LLC)': 'llc',
  'Limited liability partnership (LLP)': 'llp',
  Corporation: 'corporation',
}
const OWNERSHIP_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(OWNERSHIP_VALUE).map(([label, value]) => [value, label]),
)

export function AboutYouSection() {
  const { state, dispatch } = useAppStore()
  const a = state.draft.applicant
  const patch = (p: Partial<DraftApplicant>) => dispatch({ type: 'update-applicant', patch: p })

  return (
    <div className="flex flex-col gap-10 xl:gap-12">
      <FieldGroup
        heading="Match your identification"
        description="Enter your name exactly as it appears on your government-issued ID."
        signatureSlot
      >
        <FieldRow>
          <TextField
            label="Last name"
            required
            autoComplete="family-name"
            value={a.lastName}
            onChange={(e) => patch({ lastName: e.target.value })}
          />
          <TextField
            label="First name"
            required
            autoComplete="given-name"
            value={a.firstName}
            onChange={(e) => patch({ firstName: e.target.value })}
          />
        </FieldRow>
        <FieldRow className="sm:grid-cols-[minmax(0,1fr)_132px]">
          <TextField
            label="Middle name"
            autoComplete="additional-name"
            value={a.middleName}
            onChange={(e) => patch({ middleName: e.target.value })}
            hint="Leave blank if you don't have one."
          />
          <TextField
            label="Suffix"
            value={a.suffix}
            onChange={(e) => patch({ suffix: e.target.value })}
            placeholder="Jr, Sr, III"
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup
        heading="Other names you've been known by"
        description="Include any name you've used before — a maiden name, a married name, or any other name you've gone by. These are needed to search your history accurately and get a correct eligibility determination."
      >
        <TextField
          label="Names to include"
          value={a.allKnownNames}
          onChange={(e) => patch({ allKnownNames: e.target.value })}
          placeholder="e.g. Marcus D. Rivera; Marc Rivera"
        />
      </FieldGroup>

      <FieldGroup
        heading="Date of birth and gender"
        description="Use the date of birth and gender shown on your government-issued ID. The official form provides only Male and Female."
      >
        <FieldRow>
          <TextField
            label="Date of birth"
            required
            inputMode="numeric"
            autoComplete="bday"
            value={a.dob}
            onChange={(e) => patch({ dob: formatDate(e.target.value) })}
            placeholder="MM/DD/YYYY"
            pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
            title="Use MM/DD/YYYY."
          />
          <ChoiceField
            label="Gender"
            required
            name="gender"
            value={a.gender}
            onChange={(v) => patch({ gender: v as DraftApplicant['gender'] })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup
        heading="Where to reach you"
        description="This is how you'll be reached about your request. Use an address and email you actually check."
      >
        <TextField
          label="Street address"
          required
          autoComplete="street-address"
          value={a.addressStreet}
          onChange={(e) => patch({ addressStreet: e.target.value })}
          placeholder="e.g. 4412 Larkspur Lane, Apt 3B"
          hint="A P.O. Box works here too."
        />
        <FieldRow>
          <TextField
            label="City"
            required
            autoComplete="address-level2"
            value={a.addressCity}
            onChange={(e) => patch({ addressCity: e.target.value })}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-x-4 sm:grid-cols-[minmax(0,1fr)_110px] sm:gap-x-6">
            <SelectField
              label="State"
              required
              value={a.addressState}
              onChange={(e) => patch({ addressState: e.target.value })}
              options={US_STATES}
            />
            <TextField
              label="ZIP"
              required
              inputMode="numeric"
              autoComplete="postal-code"
            value={a.addressZip}
            onChange={(e) => patch({ addressZip: formatZip(e.target.value) })}
            pattern="[0-9]{5}(-[0-9]{4})?"
            title="Use a 5-digit or ZIP+4 code."
            />
          </div>
        </FieldRow>
        <FieldRow>
          <TextField
            label="Phone"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={a.phone}
            onChange={(e) => patch({ phone: formatPhone(e.target.value) })}
            placeholder="(713) 555-0148"
            pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{4}"
            title="Use a 10-digit phone number."
          />
          <TextField
            label="Email"
            required
            type="email"
            autoComplete="email"
            value={a.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </FieldRow>

        {/* Where the SSN would be. The absence is deliberate — say so. (D3) */}
        <p className="flex items-center gap-1.5 pt-1 text-[13px] text-muted">
          No Social Security Number field? Right — we never ask for it.
          <InfoBubble label="Why there is no SSN field">
            The official form has an SSN box, but you'll fill it in <em>by hand, in pen,
            after you print</em>. Your SSN never touches SurePath, this computer, or the
            internet. It exists only in your handwriting, on paper you control.
          </InfoBubble>
        </p>
      </FieldGroup>

      <FieldGroup
        heading="Current supervision"
        description="Answer yes if you currently report to a parole or probation officer. Community supervision after a deferred adjudication counts as probation. If you answer yes, include the officer's current contact information."
      >
        <DecisionBlock>
          <ChoiceField
            layout="decision"
            label="Are you currently on parole?"
            required
            name="onParole"
            value={a.onParole ? 'yes' : 'no'}
            onChange={(v) => patch({ onParole: v === 'yes' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          {a.onParole && (
            <ConditionalFields>
              <FieldRow>
                <TextField
                  label="Parole officer's name"
                  required
                  value={a.paroleOfficerName}
                  onChange={(e) => patch({ paroleOfficerName: e.target.value })}
                />
                <TextField
                  label="Parole officer's phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  value={a.paroleOfficerPhone}
                  onChange={(e) => patch({ paroleOfficerPhone: formatPhone(e.target.value) })}
                  placeholder="(512) 555-0100"
                  pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{4}"
                  title="Use a 10-digit phone number."
                />
              </FieldRow>
            </ConditionalFields>
          )}
        </DecisionBlock>
        <DecisionBlock last>
          <ChoiceField
            layout="decision"
            label="Are you currently on probation?"
            required
            name="onProbation"
            value={a.onProbation ? 'yes' : 'no'}
            onChange={(v) => patch({ onProbation: v === 'yes' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          {a.onProbation && (
            <ConditionalFields>
              <FieldRow>
                <TextField
                  label="Probation officer's name"
                  required
                  value={a.probationOfficerName}
                  onChange={(e) => patch({ probationOfficerName: e.target.value })}
                />
                <TextField
                  label="Probation officer's phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  value={a.probationOfficerPhone}
                  onChange={(e) => patch({ probationOfficerPhone: formatPhone(e.target.value) })}
                  placeholder="(512) 555-0100"
                  pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{4}"
                  title="Use a 10-digit phone number."
                />
              </FieldRow>
            </ConditionalFields>
          )}
        </DecisionBlock>
      </FieldGroup>

      <FieldGroup
        heading="Company applications only"
        description="Answer yes only if you own or direct a company that is applying for its own license. If you are applying only for yourself, answer no."
        last
      >
        <DecisionBlock last>
          <ChoiceField
            layout="decision"
            label="Are you a controlling person of a company applying for a license?"
            required
            name="isControllingPerson"
            value={a.isControllingPerson ? 'yes' : 'no'}
            onChange={(v) => patch({ isControllingPerson: v === 'yes' })}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          {a.isControllingPerson && (
            <ConditionalFields>
              <FieldRow>
                <TextField
                  label="Company name"
                  required
                  value={a.businessName}
                  onChange={(e) => patch({ businessName: e.target.value })}
                />
                <TextField
                  label="DBA (doing business as)"
                  value={a.businessDba}
                  onChange={(e) => patch({ businessDba: e.target.value })}
                  hint="Leave blank if none."
                />
              </FieldRow>
              <FieldRow>
                <TextField
                  label="Federal tax ID"
                  required
                  inputMode="numeric"
                  value={a.businessTaxId}
                  onChange={(e) => patch({ businessTaxId: e.target.value })}
                />
                <SelectField
                  label="Type of ownership"
                  required
                  value={OWNERSHIP_LABEL[a.businessOwnership] ?? ''}
                  onChange={(e) =>
                    patch({ businessOwnership: OWNERSHIP_VALUE[e.target.value] ?? '' })
                  }
                  options={OWNERSHIP_OPTIONS}
                  placeholder="Choose one"
                />
              </FieldRow>
            </ConditionalFields>
          )}
        </DecisionBlock>
      </FieldGroup>
    </div>
  )
}
