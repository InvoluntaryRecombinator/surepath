/**
 * Input masks. Format-as-you-type, digits only in, punctuation added for the reader.
 * These never block input — a person pasting something odd still gets their text kept;
 * we only tidy when the content is clearly the expected shape.
 */

/** (713) 555-0148 — from up to 10 digits. Extra characters are left alone. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length > 10) return raw // don't fight extensions or pasted oddities
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

/** MM/DD/YYYY — slashes appear as the digits arrive. */
export function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** 5-digit ZIP (or ZIP+4 with the hyphen placed). */
export function formatZip(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Real date validation — not "matches the mask." Returns a user-facing problem or null.
 * Empty is NOT a problem here (required-ness is the section validator's job); this fires
 * live at the field so "99/99/9999" and "banana" are caught where they're typed.
 */
export function dateProblem(
  mmddyyyy: string,
  opts: { notFuture?: boolean } = {},
): string | null {
  const v = mmddyyyy.trim()
  if (v.length === 0) return null
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v)
  if (!m) return 'Use MM/DD/YYYY.'
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (month < 1 || month > 12) return "That month doesn't exist — use 01–12."
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return `That day doesn't exist in that month.`
  if (year < 1900) return 'Check the year.'
  if (opts.notFuture !== false) {
    const date = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) return 'This date is in the future.'
  }
  return null
}

/** True when a is on or after b. Both must already be valid MM/DD/YYYY. */
export function dateOnOrAfter(a: string, b: string): boolean {
  const parse = (v: string) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim())
    return m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).getTime() : NaN
  }
  const ta = parse(a)
  const tb = parse(b)
  return !Number.isNaN(ta) && !Number.isNaN(tb) && ta >= tb
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Display formatting for prose surfaces: "05/01/1992" → "May 1, 1992".
 * Form values and PDFs keep MM/DD/YYYY — the official forms demand that shape; only what
 * a human reads in the UI gets the long form. Anything unparsable passes through untouched.
 */
export function formatLongDate(mmddyyyy: string): string {
  // Accept the slashless 8-digit form too — data typed before the mask existed, or
  // pasted around it, still deserves to read as a date.
  const m = /^(\d{2})\/?(\d{2})\/?(\d{4})$/.exec(mmddyyyy.trim())
  if (!m) return mmddyyyy
  const month = Number(m[1])
  const day = Number(m[2])
  if (month < 1 || month > 12 || day < 1 || day > 31) return mmddyyyy
  return `${MONTHS[month - 1]} ${day}, ${m[3]}`
}

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
] as const
