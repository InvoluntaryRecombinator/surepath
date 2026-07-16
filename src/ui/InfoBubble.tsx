/**
 * The ⓘ pattern (DESIGN_SYSTEM §5): explanation on demand, not flag soup. Quiet by
 * default, there when needed. Radix for behavior (focus, dismiss, Esc); our tokens for
 * everything visible.
 */
import * as Popover from '@radix-ui/react-popover'
import type { ReactNode } from 'react'

export function InfoBubble({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`More about: ${label}`}
          className="inline-flex h-[17px] w-[17px] items-center justify-center rounded-full border border-muted/60 text-[11px] font-semibold text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          i
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-w-[340px] rounded-[6px] border border-line bg-field p-4 pr-9 text-[13.5px] leading-relaxed text-ink"
        >
          {children}
          <Popover.Close
            aria-label="Close"
            className="absolute right-2.5 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-[4px] text-muted transition-colors duration-150 hover:text-ink"
          >
            ✕
          </Popover.Close>
          <Popover.Arrow className="fill-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
