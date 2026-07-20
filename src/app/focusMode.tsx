/**
 * Focus mode — the panel takeover. DESIGN_SYSTEM §9: "The narrative step is the only
 * full-bleed takeover. Nothing else earns it." When a section enters focus (the story
 * workbench), the chassis hides its briefing and its Back/Continue row — the focused
 * view owns the whole panel and its own exits. Session-only React state; nothing here
 * persists or belongs in the store.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { FocusModeContext } from './focusModeContext'

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState(false)
  const value = useMemo(() => ({ focused, setFocused }), [focused])
  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>
}
