/**
 * <Notice> — THE notice. Every conditional message the app raises renders through this
 * one component: icon, optional title, message, contained on a tinted ground. Unmissable
 * without being alarming. The bare red left-rule it replaces read as decoration and got
 * skipped — containment plus the glyph is what makes it land.
 *
 * Variants:
 *   attention — something blocks the user's next step (validation, generation failures).
 *               `state` red, role="alert". HARD requirements only — never a style accent.
 *   info      — standing facts the user must not miss (H-rule warnings, degraded modes).
 *   success   — a completed set, confirmed. Accent, quiet.
 */
import type { ReactNode, Ref } from 'react'
import { AlertCircle, CheckSmall, InfoCircle } from './icons'

const VARIANTS = {
  attention: {
    box: 'border-state/40 bg-state/[0.05]',
    icon: 'text-state',
    role: 'alert' as const,
    glyph: <AlertCircle size={16} />,
  },
  info: {
    box: 'border-accent/40 bg-accent/[0.05]',
    icon: 'text-accent',
    role: 'status' as const,
    glyph: <InfoCircle size={16} />,
  },
  success: {
    box: 'border-accent/40 bg-accent/[0.05]',
    icon: 'text-accent',
    role: 'status' as const,
    glyph: <CheckSmall size={11} />,
  },
}

export function Notice({
  variant,
  title,
  children,
  className = '',
  ref,
  tabIndex,
}: {
  variant: keyof typeof VARIANTS
  title?: string
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
  tabIndex?: number
}) {
  const v = VARIANTS[variant]
  return (
    <div
      ref={ref}
      role={v.role}
      tabIndex={tabIndex}
      className={`flex gap-3 rounded-[6px] border-l-2 px-4 py-3.5 outline-none ${v.box} ${className}`}
    >
      <span className={`mt-0.5 shrink-0 ${v.icon}`} aria-hidden="true">
        {v.glyph}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-[14px] font-semibold leading-snug text-ink">{title}</p>}
        <div
          className={`max-w-[62ch] text-[13.5px] leading-[1.55] text-ink/80 ${title ? 'mt-1' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
