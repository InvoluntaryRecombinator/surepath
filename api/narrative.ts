/**
 * /api/narrative — the Vercel adapter. THIN by design: everything real lives in
 * src/agent/server.ts, shared with the local dev middleware so dev and prod cannot drift.
 *
 * Written against Vercel's NODE runtime signature — (req, res), respond through res,
 * returns are ignored. A Web-style `return new Response(...)` is silently discarded here
 * and the request hangs to a 504; that is not a style choice, it is the runtime contract.
 * Three more contract points honored below: the runtime parses a JSON body into req.body
 * before we run (re-parsing throws); every path terminates through res (an unhandled
 * throw becomes a hanging invocation); and failures return our JSON error shape, never
 * the platform's text/plain crash page.
 *
 * Stateless. No database. Status + latency logged inside the handler; never the body. (D6)
 */
import process from 'node:process'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleNarrativeRequest } from '../src/agent/server.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }

    // The runtime has already parsed application/json into req.body. Tolerate a raw
    // string (unusual content-type) but never double-parse an object.
    let body: unknown = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        res.status(400).json({ error: 'malformed_request' })
        return
      }
    }
    if (body === undefined || body === null) {
      res.status(400).json({ error: 'malformed_request' })
      return
    }

    const result = await handleNarrativeRequest(body, {
      apiKey: process.env.OPENAI_API_KEY,
      modelId: process.env.NARRATIVE_MODEL,
    })
    res.status(result.status).json(result.body)
  } catch {
    // Fail closed with our own JSON shape — the client's manual path handles the rest.
    res.status(500).json({ error: 'assistant_unavailable' })
  }
}
