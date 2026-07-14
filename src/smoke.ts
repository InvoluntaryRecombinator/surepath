/**
 * PHASE 0 — Day-1 smoke test.  (BUILD_SEQUENCE.md)
 *
 * These are the assumptions the entire architecture rests on. Nothing else starts
 * until every check below is green. This file is framework-free on purpose: it is
 * the regression suite, not a screen.
 *
 * It runs IN THE BROWSER, against the real blanks in public/forms/, because that is
 * where the document service will run. Passing in Node would prove nothing. (D5)
 */
import {
  PDFDocument,
  PDFName,
  PDFRadioGroup,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFSignature,
  type PDFField,
  type PDFForm,
} from 'pdf-lib'

export type CheckStatus = 'pass' | 'fail' | 'manual'

export type Check = {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export type Artifact = {
  name: string
  blob: Blob
  note: string
}

export type SmokeReport = {
  checks: Check[]
  artifacts: Artifact[]
  evidence: string[]
}

const ENF006_URL = '/forms/ENF006_blank.pdf'
const ENF003_URL = '/forms/ENF003_blank.pdf'

/** Expected field counts, from CLAUDE.md F10 (32 fillable + 1 /Sig, 23 fillable + 1 /Sig). */
const EXPECTED_FIELDS = { ENF006: 33, ENF003: 24 }

/** Names copied from data/tdlr_field_map.json. Phase 1 will import them from a typed map;
 *  Phase 0 states them literally so a mismatch shows up here, not in the packet. */
const SSN_FIELD = {
  ENF006: 'Social Security Number',
  ENF003: 'See instruction sheet for disclosure information',
}
const SIG_FIELD = {
  ENF006: 'Signature of person who is subject of this evaluation',
  ENF003: 'Signature3',
}

async function loadBlank(url: string): Promise<PDFDocument> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}. The blanks must live in public/forms/.`)
  return PDFDocument.load(await res.arrayBuffer())
}

/**
 * Select a radio export value, defensively.
 *
 * The field map and the PDF spec write export values with a leading slash (/No, /Choice3)
 * because that is PDF name syntax. pdf-lib's JS API may or may not want the slash. Guessing
 * wrong here is the F8 failure mode: no throw, no test failure, the box silently stays /Off,
 * and the packet arrives at TDLR with blank required fields.
 *
 * So: normalise, then verify the value actually exists on this field before selecting it,
 * and read it back afterwards. Fail closed.
 */
function selectExportValue(group: PDFRadioGroup, exportValue: string): string {
  const wanted = exportValue.replace(/^\//, '')
  const options = group.getOptions()
  if (!options.includes(wanted)) {
    throw new Error(
      `export value "${exportValue}" is not an option on this field. ` +
        `Actual options: [${options.map((o) => `/${o}`).join(', ')}]`,
    )
  }
  group.select(wanted)
  const selected = group.getSelected()
  if (selected !== wanted) {
    throw new Error(`selected "${wanted}" but the field reads back "${selected}"`)
  }
  return selected
}

/** Read whatever value a field currently holds, whatever its type. Used to prove the blanks
 *  are clean (D7) and to prove we never wrote the SSN (A2). */
function readValue(field: PDFField): string | null {
  try {
    if (field instanceof PDFTextField) return field.getText() ?? null
    if (field instanceof PDFRadioGroup) return field.getSelected() ?? null
    if (field instanceof PDFCheckBox) return field.isChecked() ? 'checked' : null
    if (field instanceof PDFDropdown) return field.getSelected().join(', ') || null
    if (field instanceof PDFSignature) {
      // A /Sig field's value is a signature dictionary, not text. Its presence means SIGNED.
      return field.acroField.dict.has(PDFName.of('V')) ? 'SIGNED' : null
    }
  } catch {
    return null
  }
  return null
}

function fieldsWithValues(form: PDFForm): string[] {
  return form
    .getFields()
    .map((f) => ({ name: f.getName(), value: readValue(f) }))
    .filter((f) => f.value !== null && f.value !== '')
    .map((f) => `${f.name} = ${f.value}`)
}

export async function runSmoke(): Promise<SmokeReport> {
  const checks: Check[] = []
  const artifacts: Artifact[] = []
  const evidence: string[] = []

  const check = async (id: string, label: string, fn: () => Promise<string> | string) => {
    try {
      const detail = await fn()
      checks.push({ id, label, status: 'pass', detail })
    } catch (err) {
      checks.push({ id, label, status: 'fail', detail: err instanceof Error ? err.message : String(err) })
    }
  }

  // ── 1 ────────────────────────────────────────────────────────────────────────
  checks.push({
    id: '1',
    label: 'Vite + React + TS scaffold runs',
    status: 'pass',
    detail: 'You are reading this page. It rendered.',
  })

  // ── 2 ────────────────────────────────────────────────────────────────────────
  let enf006: PDFDocument
  let enf003: PDFDocument
  try {
    enf006 = await loadBlank(ENF006_URL)
    enf003 = await loadBlank(ENF003_URL)
    checks.push({
      id: '2',
      label: 'pdf-lib loads the blanks IN THE BROWSER (not Node)',
      status: 'pass',
      detail: `ENF006: ${enf006.getPageCount()} page(s) · ENF003: ${enf003.getPageCount()} page(s), fetched from public/forms/`,
    })
  } catch (err) {
    checks.push({
      id: '2',
      label: 'pdf-lib loads the blanks IN THE BROWSER (not Node)',
      status: 'fail',
      detail: err instanceof Error ? err.message : String(err),
    })
    checks.push({
      id: '—',
      label: 'Remaining checks skipped',
      status: 'fail',
      detail: 'The templates did not load. Nothing downstream can be trusted.',
    })
    return { checks, artifacts, evidence }
  }

  const form006: PDFForm = enf006.getForm()
  const form003: PDFForm = enf003.getForm()

  // ── 3 ────────────────────────────────────────────────────────────────────────
  await check('3', 'getFields() → 33 on ENF006, 24 on ENF003', () => {
    const n006 = form006.getFields().length
    const n003 = form003.getFields().length
    if (n006 !== EXPECTED_FIELDS.ENF006 || n003 !== EXPECTED_FIELDS.ENF003) {
      throw new Error(
        `got ENF006=${n006} (expected ${EXPECTED_FIELDS.ENF006}), ENF003=${n003} (expected ${EXPECTED_FIELDS.ENF003}). ` +
          `A count mismatch means these are NOT the authoritative blanks. See D7 — do not build on them.`,
      )
    }
    return `ENF006=${n006}, ENF003=${n003}. Matches F10.`
  })

  // ── Evidence: are the blanks actually blank? (D7) ────────────────────────────
  // Not one of the eleven, but it is the check that caught the /General Partnership
  // contamination, and it costs nothing to keep.
  const residue006 = fieldsWithValues(form006)
  const residue003 = fieldsWithValues(form003)
  evidence.push(
    residue006.length === 0
      ? 'ENF006 blank: zero residual field values. Clean.'
      : `⚠ ENF006 blank carries ${residue006.length} residual value(s): ${residue006.join(' · ')}`,
  )
  evidence.push(
    residue003.length === 0
      ? 'ENF003 blank: zero residual field values. Clean.'
      : `⚠ ENF003 blank carries ${residue003.length} residual value(s): ${residue003.join(' · ')}`,
  )

  // ── Evidence: the ACTUAL export values, read off the forms ───────────────────
  // The single most valuable output of this whole file. Ground truth, not memory,
  // not the docs, not a guess. (F8)
  const buttonFields: [string, PDFForm, string][] = [
    ['ENF006', form006, 'Gender'],
    ['ENF006', form006, 'Type of Ownership'],
    ['ENF006', form006, 'Are you currently on parole?'],
    ['ENF006', form006, 'Are you currently on probation?'],
    ['ENF003', form003, 'Type of Request'],
    ['ENF003', form003, '#16'],
    ['ENF003', form003, '#17'],
    ['ENF003', form003, '#18'],
  ]
  for (const [formName, form, fieldName] of buttonFields) {
    try {
      const opts = form.getRadioGroup(fieldName).getOptions()
      evidence.push(`${formName} · "${fieldName}" → [${opts.map((o) => `/${o}`).join(', ')}]`)
    } catch (err) {
      evidence.push(`⚠ ${formName} · "${fieldName}" → ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── 4 ────────────────────────────────────────────────────────────────────────
  await check('4', `getTextField('Last Name').setText('RIVERA')`, () => {
    const f = form006.getTextField('Last Name')
    f.setText('RIVERA')
    const readback = f.getText()
    if (readback !== 'RIVERA') throw new Error(`wrote RIVERA, read back "${readback}"`)
    return 'Text written and read back from the field.'
  })

  // ── 5 ────────────────────────────────────────────────────────────────────────
  await check('5', `ENF006 parole → /No  (semantic export values)`, () => {
    const v = selectExportValue(form006.getRadioGroup('Are you currently on parole?'), '/No')
    return `ticked, reads back "/${v}".`
  })

  // ── 6 ────────────────────────────────────────────────────────────────────────
  await check('6', `ENF003 '#17'.select('/Choice1') → ticks NO`, () => {
    const v = selectExportValue(form003.getRadioGroup('#17'), '/Choice1')
    return `ticked, reads back "/${v}".`
  })

  // ── 7 ────────────────────────────────────────────────────────────────────────
  // On a FRESH copy — selecting Choice3 on the same doc would just overwrite Choice1
  // and prove nothing about Choice1.
  await check('7', `ENF003 '#17'.select('/Choice3') → ticks YES  (NOT /Choice2)`, async () => {
    const fresh = await loadBlank(ENF003_URL)
    const group = fresh.getForm().getRadioGroup('#17')
    const options = group.getOptions()
    const v = selectExportValue(group, '/Choice3')
    const hasChoice2 = options.includes('Choice2')
    return (
      `ticked, reads back "/${v}". Options on this field: [${options.map((o) => `/${o}`).join(', ')}]` +
      (hasChoice2
        ? ' — ⚠ /Choice2 DOES exist on this field; re-verify which value means Yes.'
        : ' — /Choice2 does not exist on this field, exactly as F8 warns.')
    )
  })

  // ── The /Sig question — the one that can actually blow up ────────────────────
  // Fill a realistic ENF006, then flatten it with the /Sig field present.
  const sig006 = form006.getFields().find((f) => f.getName() === SIG_FIELD.ENF006)
  evidence.push(
    sig006
      ? `ENF006 /Sig field present: "${sig006.getName()}" (${sig006.constructor.name}) — must survive to the printer unsigned. (L6)`
      : `⚠ ENF006 /Sig field NOT FOUND. The template may be a mangled copy. See D7.`,
  )

  // Snapshot the filled-but-unflattened bytes. A2/A2b are asserted against THESE, because
  // after flatten() the fields are gone and there is nothing left to interrogate.
  const filledBytes = await enf006.save()

  await check('8', 'form.flatten() succeeds WITH the /Sig field present', async () => {
    const doc = await PDFDocument.load(filledBytes)
    doc.getForm().flatten()
    const bytes = await doc.save()
    artifacts.push({
      name: 'smoke_ENF006_flattened.pdf',
      blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
      note: 'Filled + flattened. Open it, print-preview it, confirm RIVERA is burned in and the signature line is blank.',
    })
    return 'flatten() did not throw. The /Sig fallback in BUILD_SEQUENCE is not needed.'
  })

  // ── 9 ────────────────────────────────────────────────────────────────────────
  checks.push({
    id: '9',
    label: 'Flattened output renders identically in Chrome preview and print preview',
    status: 'manual',
    detail: 'Download the artifact below, open it, then Cmd-P. A human has to look at this one.',
  })

  // ── 10 ───────────────────────────────────────────────────────────────────────
  await check('10', 'Blob download works · text is burned in, not a live field', async () => {
    const doc = await PDFDocument.load(filledBytes)
    doc.getForm().flatten()
    const reread = await PDFDocument.load(await doc.save())
    const remaining = reread.getForm().getFields().length
    if (remaining !== 0) {
      throw new Error(`${remaining} live field(s) survived flatten(). The text is still editable.`)
    }
    return 'Re-read the flattened bytes: 0 live fields remain. The text is page content now.'
  })

  // ── 11 (A2) ──────────────────────────────────────────────────────────────────
  // Re-read the GENERATED BYTES, not the in-memory form object. An in-memory check
  // would confirm what we intended to write, not what we actually wrote. (A13)
  await check('11a', 'SSN field is EMPTY in the output (A2)', async () => {
    const reread = await PDFDocument.load(filledBytes)
    const f = reread.getForm().getFields().find((x) => x.getName() === SSN_FIELD.ENF006)
    if (!f) throw new Error(`SSN field "${SSN_FIELD.ENF006}" not found on ENF006.`)
    const v = readValue(f)
    if (v !== null && v !== '') throw new Error(`SSN field holds "${v}". It must be empty. (D3)`)
    return 'Re-read from generated bytes: empty. The user hand-writes it, in pen.'
  })

  // ── 11 (A2b) ─────────────────────────────────────────────────────────────────
  await check('11b', '/Sig field is UNSIGNED in the output (A2b)', async () => {
    const reread = await PDFDocument.load(filledBytes)
    const f = reread.getForm().getFields().find((x) => x.getName() === SIG_FIELD.ENF006)
    if (!f) throw new Error(`/Sig field "${SIG_FIELD.ENF006}" not found on ENF006.`)
    if (f.acroField.dict.has(PDFName.of('V'))) {
      throw new Error('The /Sig field carries a value. SurePath must NEVER sign. (L6)')
    }
    return 'Re-read from generated bytes: no /V on the signature dictionary. Unsigned. Wet ink only.'
  })

  return { checks, artifacts, evidence }
}
