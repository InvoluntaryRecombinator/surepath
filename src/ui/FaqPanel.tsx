/**
 * The FAQ panel — the state's own words, surfaced where the question actually arises
 * (DESIGN_SYSTEM §12). Collapsed by default. TDLR items are paraphrased, attributed, and
 * linked; the expunged/sealed item is OURS and is labeled as an unresolved question (L8).
 */
import type { FaqItem } from '../state-config/types'

export function FaqPanel({ items }: { items: FaqItem[] }) {
  return (
    <section aria-label="Common questions">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
        Common questions
      </h2>
      <div className="mt-2 border-t border-line">
        {items.map((item) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex cursor-pointer items-center gap-2.5 py-3 text-[14.5px] font-medium text-ink transition-colors duration-150 hover:text-accent [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="text-[11px] text-muted transition-transform duration-150 group-open:rotate-90"
              >
                ▶
              </span>
              {item.q}
            </summary>
            <div className="pb-4 pl-6 pr-2">
              <p className="max-w-[62ch] text-[14px] leading-relaxed text-ink/80">{item.a}</p>
              {item.attribution === 'tdlr' && item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[12.5px] font-medium text-accent hover:underline"
                >
                  Read the official guidance ↗
                </a>
              ) : (
                <p className="mt-1.5 text-[12.5px] font-medium text-muted">
                  This is our note, not official guidance. The decision is yours to make.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
