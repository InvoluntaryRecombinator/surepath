/**
 * A logical group of fields, the reference's core rhythm:
 *
 *   group heading          15px / 600, ink
 *   one-line description   13.5px, muted           ← 4px below the heading
 *   the fields             20px below, 640px cap
 *   ────────────────────   full-width hairline     ← 36px below, FAINTER than input borders
 *
 * Two line weights on one screen: component borders at --color-line, structural hairlines
 * at --color-line/60. Nobody consciously notices; everyone feels it.
 */
import type { ReactNode } from 'react'

export function FieldGroup({
  heading,
  description,
  last = false,
  children,
}: {
  heading: string
  description?: string
  last?: boolean
  children: ReactNode
}) {
  return (
    <section className={last ? '' : 'border-b border-line/60 pb-9'}>
      <h2 className="text-[15px] font-semibold leading-snug text-ink">{heading}</h2>
      {description && (
        <p className="mt-1 max-w-[58ch] text-[13.5px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      <div className="mt-5 flex max-w-[640px] flex-col gap-[18px]">{children}</div>
    </section>
  )
}

/** A genuine pair, side by side — dates, first/last, city/state. Never a dense grid. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-[18px]">{children}</div>
}
