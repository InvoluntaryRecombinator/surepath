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
  last = false,
  children,
}: {
  heading: string
  description?: string
  signatureSlot?: boolean
  last?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`grid grid-cols-1 gap-x-12 xl:grid-cols-[216px_minmax(0,1fr)] ${
        last ? '' : 'border-b border-line/55 pb-11'
      }`}
    >
      <aside className="flex flex-col">
        <h2 className="text-[17px] font-semibold leading-[1.35] text-ink">{heading}</h2>
        {description && (
          <p className="mt-2 text-[14px] leading-[1.65] text-muted">{description}</p>
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
  return <div className="border-l border-line pl-5">{children}</div>
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
    <div className={`grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 ${className}`}>
      {children}
    </div>
  )
}
