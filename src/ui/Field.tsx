/**
 * The field: label (recedes) over a crisp WHITE input (the figure) — the contrast that
 * fixes "murky" (DESIGN_SYSTEM §3–§5). Placeholder examples teach format without a
 * manual. A real <label> on every input. Required marks use --color-state, the only
 * always-visible red in the app.
 *
 * Metrics are deliberate and shared: 44px inputs, 4px radius, compact semibold labels,
 * and a border that darkens one step on hover (nothing else moves).
 */
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { InfoBubble } from './InfoBubble'

export const inputClass =
  'h-11 w-full rounded-[4px] border border-line bg-field px-4 text-[15px] text-ink ' +
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
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className="text-[13.5px] font-semibold leading-[18px] text-muted"
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
      {hint && <p className="text-[12.5px] leading-[18px] text-muted">{hint}</p>}
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

/** A labeled pair of choices with visible radio structure — nothing to figure out. */
export function ChoiceField({
  label,
  required,
  info,
  name,
  value,
  options,
  onChange,
  layout = 'stacked',
}: {
  label: string
  required?: boolean
  info?: ReactNode
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  layout?: 'stacked' | 'decision'
}) {
  const controls = (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = value === o.value
        return (
          <label
            key={o.value}
            className={`inline-flex h-11 min-w-[92px] cursor-pointer items-center gap-2.5 rounded-[4px] border px-3.5 text-[14px] transition-colors duration-150 ${
              active
                ? 'border-accent bg-accent/5 font-semibold text-accent'
                : 'border-line bg-field text-ink hover:border-muted/70'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              required={required}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                active ? 'border-accent' : 'border-muted/70'
              }`}
            >
              {active && <span className="h-2 w-2 rounded-full bg-accent" />}
            </span>
            {o.label}
          </label>
        )
      })}
    </div>
  )

  if (layout === 'decision') {
    return (
      <fieldset>
        <legend className="sr-only">{label}</legend>
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold leading-[1.45] text-ink">
            <span aria-hidden="true">{label}</span>
            {required && (
              <span className="text-state/80" aria-hidden="true">
                *
              </span>
            )}
            {info && <InfoBubble label={label}>{info}</InfoBubble>}
          </div>
          {controls}
        </div>
      </fieldset>
    )
  }

  return (
    <fieldset className="flex flex-col gap-[7px]">
      <legend className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-[18px] text-muted">
        {label}
        {required && (
          <span className="text-state/80" aria-hidden="true">
            *
          </span>
        )}
        {info && <InfoBubble label={label}>{info}</InfoBubble>}
      </legend>
      {controls}
    </fieldset>
  )
}
