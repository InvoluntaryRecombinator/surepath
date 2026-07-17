/**
 * A styled native <select>. Native for the behavior (keyboard, mobile wheel, a11y for
 * free); styled so it sits with the white fields instead of screaming "unstyled control."
 * The chevron is our own — drawn inline, muted, and it doesn't react to hover (the border
 * does; one thing moves at a time).
 */
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { FieldShell } from './Field'

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
  label: string
  required?: boolean
  hint?: string
  info?: ReactNode
  options: readonly string[]
  /** Shown as a disabled first option when the value is still empty. */
  placeholder?: string
}

const chevron =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1.5 1.75 6 6.25l4.5-4.5' fill='none' stroke='%238a8266' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

export function SelectField({
  label,
  required,
  hint,
  info,
  options,
  placeholder,
  ...select
}: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell label={label} required={required} hint={hint} info={info} htmlFor={id}>
      <select
        id={id}
        className="h-10 w-full cursor-pointer appearance-none rounded-[4px] border border-line bg-field bg-[length:12px_8px] bg-[position:right_12px_center] bg-no-repeat pl-3.5 pr-9 text-[15px] text-ink transition-colors duration-150 hover:border-muted/70"
        style={{ backgroundImage: chevron }}
        {...select}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
