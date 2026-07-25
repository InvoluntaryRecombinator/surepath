/**
 * Did the user attempt to Continue on this section? Sections use this to decide when
 * required-empty errors surface AT the field (live format errors show regardless —
 * "banana" in a date field never waits for a button press). Provided by AppLayout.
 */
import { createContext, useContext } from 'react'

export const AttemptedContext = createContext(false)
export const useAttempted = () => useContext(AttemptedContext)
