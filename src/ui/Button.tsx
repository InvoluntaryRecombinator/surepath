import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'bg-accent text-field font-semibold hover:bg-accent-deep active:bg-accent-deep disabled:opacity-40 px-5 h-11',
  secondary:
    'bg-field text-ink font-medium border border-line hover:border-accent hover:text-accent disabled:opacity-40 px-4 h-10',
  ghost:
    'bg-transparent text-accent font-medium hover:underline underline-offset-4 disabled:opacity-40 px-2 h-10',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-[4px] text-[15px] transition-colors duration-150 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
