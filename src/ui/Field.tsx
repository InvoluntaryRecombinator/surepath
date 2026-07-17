/**
 * The field: label (recedes) over a crisp WHITE input (the figure) — the contrast that
 * fixes "murky" (DESIGN_SYSTEM §3–§5). Placeholder examples teach format without a
 * manual. A real <label> on every input. Required marks use --color-state, the only
 * always-visible red in the app.
 *
 * Metrics are deliberate and shared: 40px inputs, 4px radius, 13px labels with a whisper
 * of tracking, hover darkens the border one step (the border reacts; nothing else moves).
 */
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { InfoBubble } from './InfoBubble'

export const inputClass =
  'h-10 w-full rounded-[4px] border border-line bg-field px-3.5 text-[15px] text-ink ' +
  'placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70'

type FieldShellProps = {
  label: string
  required?: boolean
  hint?: string
  info?: ReactNode
  htmlFor: string
  children: ReactNode
}

export function FieldShell({ label, required, hint, info, htmlFor, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium tracking-[0.01em] text-muted"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-state/80" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {info && <InfoBubble label={label}>{info}</InfoBubble>}
      </div>
      {children}
      {hint && <p className="text-[12.5px] leading-snug text-muted">{hint}</p>}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
  label: string
  required?: boolean
  hint?: string
  info?: ReactNode
}

export function TextField({ label, required, hint, info, ...input }: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell label={label} required={required} hint={hint} info={info} htmlFor={id}>
      <input id={id} className={inputClass} {...input} />
    </FieldShell>
  )
}

/** A labeled pair of choices rendered as obvious pill radios — nothing to figure out. */
export function ChoiceField({
  label,
  required,
  info,
  name,
  value,
  options,
  onChange,
}: {
  label: string
  required?: boolean
  info?: ReactNode
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.01em] text-muted">
        {label}
        {required && (
          <span className="text-state/80" aria-hidden="true">
            *
          </span>
        )}
        {info && <InfoBubble label={label}>{info}</InfoBubble>}
      </legend>
      <div className="flex gap-2">
        {options.map((o) => {
          const active = value === o.value
          return (
            <label
              key={o.value}
              className={`inline-flex h-10 cursor-pointer items-center rounded-[4px] border px-4 text-[14px] transition-colors duration-150 ${
                active
                  ? 'border-accent bg-field font-semibold text-accent'
                  : 'border-line bg-field text-ink hover:border-muted/70'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
