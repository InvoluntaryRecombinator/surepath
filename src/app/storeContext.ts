/**
 * Store context, hook, and storage helpers — separated from the provider component so
 * react-refresh stays happy and so non-React code (the Rail's erase control) can reach
 * the storage key.
 */
import { createContext, useContext, type Dispatch } from 'react'
import type { StateConfig } from '../state-config/types'
import type { AppState, Action } from './store'

export const storageKey = (config: StateConfig) => `surepath.${config.code.toLowerCase()}.v1`

/** Wipe this state's saved data from this computer. Used by "Delete my information". */
export function eraseStoredData(config: StateConfig): void {
  localStorage.removeItem(storageKey(config))
}

export const StoreCtx = createContext<{
  state: AppState
  dispatch: Dispatch<Action>
  config: StateConfig
} | null>(null)

export function useAppStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return ctx
}
