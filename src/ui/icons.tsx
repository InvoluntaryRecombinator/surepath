/**
 * Small stroke icons, drawn inline — no icon library. Each one is wayfinding on the rail
 * (they break up word fatigue), not decoration. 1.5px stroke, currentColor, 18px box.
 */
import type { IconKey } from '../state-config/types'

type P = { size?: number; className?: string }

const S = ({ size = 18, className, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const Icon = ({ name, ...p }: P & { name: IconKey }) => {
  switch (name) {
    case 'briefcase':
      return (
        <S {...p}>
          <rect x="2.75" y="6" width="14.5" height="10" rx="1.5" />
          <path d="M7 6V4.75A1.75 1.75 0 0 1 8.75 3h2.5A1.75 1.75 0 0 1 13 4.75V6" />
          <path d="M2.75 10.5h14.5" />
        </S>
      )
    case 'person':
      return (
        <S {...p}>
          <circle cx="10" cy="6.5" r="3" />
          <path d="M3.75 17c.75-3.2 3.25-4.75 6.25-4.75S15.5 13.8 16.25 17" />
        </S>
      )
    case 'folder':
      return (
        <S {...p}>
          <path d="M2.75 5.5A1.75 1.75 0 0 1 4.5 3.75h3.1c.5 0 .97.21 1.3.58l1.1 1.17h5.5a1.75 1.75 0 0 1 1.75 1.75v7A1.75 1.75 0 0 1 15.5 16h-11a1.75 1.75 0 0 1-1.75-1.75v-8.75Z" />
        </S>
      )
    case 'pen':
      return (
        <S {...p}>
          <path d="m12.9 3.6 3.5 3.5L7 16.5l-4.25.75L3.5 13 12.9 3.6Z" />
          <path d="m11 5.5 3.5 3.5" />
        </S>
      )
    case 'certificate':
      return (
        <S {...p}>
          <rect x="2.75" y="3.75" width="14.5" height="10" rx="1.5" />
          <path d="M6 7.25h8M6 10h4.5" />
          <path d="m13.5 13.75v3.5l1.75-1.1 1.75 1.1v-3.5" />
        </S>
      )
    case 'seal':
      return (
        <S {...p}>
          <circle cx="10" cy="10" r="6.75" />
          <path d="m7.25 10.2 1.9 1.9 3.8-4" />
        </S>
      )
  }
}

/** The wordmark's small mark — a route pin. Placeholder for a real logo; the slot exists. */
export const Mark = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect width="22" height="22" rx="5" fill="var(--color-accent)" />
    <path
      d="M6 14.5c3.5 0 3.5-7 10-6.5M13.5 5.5 16 8l-2.5 2.5"
      stroke="#fff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export const CheckSmall = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 8" fill="none" aria-hidden="true">
    <path
      d="M1 4.2 3.6 6.7 9 1.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ArrowLeft = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M13 8H3M7 4 3 8l4 4" />
  </svg>
)

export const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

/** Notice glyphs — severity is structure, not decoration: each names the kind of message. */
export const AlertCircle = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.8v3.8" />
    <path d="M8 11.3h.01" />
  </svg>
)

export const InfoCircle = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 7.4v3.8" />
    <path d="M8 4.7h.01" />
  </svg>
)

export const Menu = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M3 4.5h12M3 9h12M3 13.5h12" />
  </svg>
)
