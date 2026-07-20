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
