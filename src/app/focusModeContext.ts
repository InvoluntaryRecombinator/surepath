/**
 * Focus mode context + hooks (provider lives in focusMode.tsx — same split as
 * store/storeContext, for fast refresh). See focusMode.tsx for what focus mode is.
 */
import { createContext, useContext, useEffect } from 'react'

export const FocusModeContext = createContext<{
  focused: boolean
  setFocused: (value: boolean) => void
}>({ focused: false, setFocused: () => {} })

export function useFocusMode(): boolean {
  return useContext(FocusModeContext).focused
}

/** Declarative: the mounting component holds focus for exactly as long as `active`. */
export function useHoldFocus(active: boolean) {
  const { setFocused } = useContext(FocusModeContext)
  useEffect(() => {
    setFocused(active)
    return () => setFocused(false)
  }, [active, setFocused])
}
