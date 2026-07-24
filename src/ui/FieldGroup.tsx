/**
 * A logical group of fields with two jobs kept distinct:
 *
 *   guidance / why         restrained left column
 *   fields / action        wider right column
 *   ────────────────────   full-width hairline between groups
 *
 * The columns collapse below wide desktop. The empty signature slot is deliberate: it
 * reserves a home for a future visual element without inventing a placeholder card.
 */
import type { ReactNode } from 'react'

export function FieldGroup({
  heading,
  description,
  signatureSlot = false,
  children,
}: {
  heading: string
  description?: string
  signatureSlot?: boolean
  last?: boolean
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-x-12 border-t border-line/75 pt-5 xl:grid-cols-[216px_minmax(0,1fr)]">
      <aside className="flex flex-col">
        <h2 className="text-[11.5px] font-bold uppercase leading-[1.4] tracking-[0.14em] text-accent">
          {heading}
        </h2>
        {description && (
          <p className="mt-2 text-[15px] leading-[1.65] text-ink">{description}</p>
        )}
        {signatureSlot && (
          <div
            aria-hidden="true"
            data-signature-slot
            className="mt-10 hidden min-h-24 xl:block"
          />
        )}
      </aside>
      <div className="mt-6 flex max-w-[640px] flex-col gap-5 xl:mt-0 xl:max-w-none">
        {children}
      </div>
    </section>
  )
}

export function DecisionBlock({
  children,
  last = false,
}: {
  children: ReactNode
  last?: boolean
}) {
  return (
    <div className={`flex flex-col gap-5 ${last ? '' : 'border-b border-line/50 pb-5'}`}>
      {children}
    </div>
  )
}

export function ConditionalFields({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5 border-l border-line pl-5">{children}</div>
}

/** A genuine pair, side by side — dates, first/last, city/state. Never a dense grid. */
export function FieldRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 items-start gap-x-8 gap-y-5 sm:grid-cols-2 ${className}`}>
      {children}
    </div>
  )
}
