/** Outlet-context plumbing for the state modal (split from MarketingLayout for fast
 *  refresh). The modal is the ONLY way to "find your state" — /states is gone. */
import { useOutletContext } from 'react-router-dom'

export type MarketingOutletContext = { openStateModal: () => void }

export function useStateModal() {
  return useOutletContext<MarketingOutletContext>().openStateModal
}
