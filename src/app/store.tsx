/**
 * The application store: draft case + current section, autosaved to localStorage on every
 * change (D4 as amended; SITE_STRUCTURE §4). Close the tab, reopen /texas/apply, land
 * exactly where you were.
 *
 * The words "localStorage"/"sessionStorage" never reach the user — storage is framed as
 * protection, deletion as safety. The stored data never includes an SSN (D3).
 */
import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { StateConfig } from '../state-config/types'
import { StoreCtx, storageKey } from './storeContext'
import {
  emptyApplicant,
  emptyDraft,
  newCharge,
  newIncident,
  type DraftApplicant,
  type DraftCase,
  type DraftCharge,
  type DraftIncident,
} from './draft'

export type AppState = {
  draft: DraftCase
  sectionId: string
  /** Highest section index reached — the rail lets you revisit, never skip ahead. */
  maxReachedIndex: number
  /** True when this session was restored from a previous visit on this computer. */
  resumed: boolean
}

export type Action =
  | { type: 'go'; sectionId: string; index: number }
  | { type: 'update-applicant'; patch: Partial<DraftApplicant> }
  | { type: 'add-incident' }
  | { type: 'add-single-charge' }
  | { type: 'update-incident'; id: string; patch: Partial<DraftIncident> }
  | { type: 'remove-incident'; id: string }
  | { type: 'add-charge'; incidentId: string }
  | { type: 'update-charge'; incidentId: string; chargeId: string; patch: Partial<DraftCharge> }
  | { type: 'remove-charge'; incidentId: string; chargeId: string }
  | { type: 'add-license'; program: string; specificLicenseType: string }
  | { type: 'remove-license'; index: number }
  | { type: 'delete-everything' }
  | { type: 'dismiss-resumed' }

function makeReducer(config: StateConfig) {
  const mapIncident = (
    draft: DraftCase,
    id: string,
    fn: (i: DraftIncident) => DraftIncident,
  ): DraftCase => ({
    ...draft,
    incidents: draft.incidents.map((i) => (i.id === id ? fn(i) : i)),
  })

  return function reduce(s: AppState, a: Action): AppState {
    switch (a.type) {
      case 'go':
        return {
          ...s,
          sectionId: a.sectionId,
          maxReachedIndex: Math.max(s.maxReachedIndex, a.index),
        }
      case 'update-applicant':
        return {
          ...s,
          draft: { ...s.draft, applicant: { ...s.draft.applicant, ...a.patch } },
        }
      case 'add-incident':
      case 'add-single-charge':
        // Two doors, one structure: a standalone conviction IS an incident with exactly one
        // charge. Same tree, same PDF loop. No second code path. (ARCHITECTURE §4)
        return {
          ...s,
          draft: {
            ...s.draft,
            incidents: [...s.draft.incidents, newIncident(config.defaults.incidentState)],
          },
        }
      case 'update-incident':
        return { ...s, draft: mapIncident(s.draft, a.id, (i) => ({ ...i, ...a.patch })) }
      case 'remove-incident':
        return {
          ...s,
          draft: { ...s.draft, incidents: s.draft.incidents.filter((i) => i.id !== a.id) },
        }
      case 'add-charge':
        return {
          ...s,
          draft: mapIncident(s.draft, a.incidentId, (i) => ({
            ...i,
            charges: [...i.charges, newCharge()],
          })),
        }
      case 'update-charge':
        return {
          ...s,
          draft: mapIncident(s.draft, a.incidentId, (i) => ({
            ...i,
            charges: i.charges.map((c) => (c.id === a.chargeId ? { ...c, ...a.patch } : c)),
          })),
        }
      case 'remove-charge':
        return {
          ...s,
          draft: mapIncident(s.draft, a.incidentId, (i) => ({
            ...i,
            charges: i.charges.filter((c) => c.id !== a.chargeId),
          })),
        }
      case 'add-license':
        // One packet, one fee, per entry. Duplicates are meaningless — same packet twice.
        if (
          s.draft.licenses.some(
            (l) => l.program === a.program && l.specificLicenseType === a.specificLicenseType,
          )
        ) {
          return s
        }
        return {
          ...s,
          draft: {
            ...s.draft,
            licenses: [
              ...s.draft.licenses,
              { program: a.program, specificLicenseType: a.specificLicenseType },
            ],
          },
        }
      case 'remove-license':
        return {
          ...s,
          draft: {
            ...s.draft,
            licenses: s.draft.licenses.filter((_, i) => i !== a.index),
          },
        }
      case 'delete-everything':
        return initialState(config, /* restore */ false)
      case 'dismiss-resumed':
        return { ...s, resumed: false }
    }
  }
}

type Stored = { draft: DraftCase; sectionId: string; maxReachedIndex: number; savedAt: string }

function initialState(config: StateConfig, restore = true): AppState {
  const freshDraft = emptyDraft()
  freshDraft.applicant.addressState = config.defaults.addressState
  const fresh: AppState = {
    draft: freshDraft,
    sectionId: config.sections[0].id,
    maxReachedIndex: 0,
    resumed: false,
  }
  if (!restore) return fresh
  try {
    const raw = localStorage.getItem(storageKey(config))
    if (!raw) return fresh
    const stored = JSON.parse(raw) as Stored
    if (stored.draft?.version !== 1) return fresh
    const sectionId = config.sections.some((x) => x.id === stored.sectionId)
      ? stored.sectionId
      : config.sections[0].id
    return {
      // Defensive merge: a draft saved by an older build may lack newer fields. Missing
      // keys get empty defaults instead of becoming undefined in controlled inputs.
      draft: {
        ...fresh.draft,
        ...stored.draft,
        applicant: { ...emptyApplicant, ...stored.draft.applicant },
      },
      sectionId,
      // The section list can change between builds (the 'trade' step collapsed into the
      // /texas intro). A stored index may be off-by-one against the new list or point past
      // its end — clamp it, and never below the section the user is actually standing on.
      maxReachedIndex: Math.max(
        config.sections.findIndex((x) => x.id === sectionId),
        Math.min(stored.maxReachedIndex ?? 0, config.sections.length - 1),
      ),
      resumed: true,
    }
  } catch {
    return fresh
  }
}


export function AppStoreProvider({
  config,
  children,
}: {
  config: StateConfig
  children: ReactNode
}) {
  const reducer = useMemo(() => makeReducer(config), [config])
  const [state, dispatch] = useReducer(reducer, config, (c) => initialState(c))

  // Autosave on every change. Nobody clicks "Save" mid-session — this is the whole point.
  useEffect(() => {
    const stored: Stored = {
      draft: state.draft,
      sectionId: state.sectionId,
      maxReachedIndex: state.maxReachedIndex,
      savedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(storageKey(config), JSON.stringify(stored))
    } catch {
      // Storage full or blocked: the app keeps working; export/download remains available.
    }
  }, [state, config])

  return <StoreCtx.Provider value={{ state, dispatch, config }}>{children}</StoreCtx.Provider>
}
