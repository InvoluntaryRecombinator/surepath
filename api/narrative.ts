/**
 * /api/narrative — the Vercel adapter. THIN by design (~20 lines): everything real lives in
 * src/agent/server.ts, shared with the local dev middleware so dev and prod cannot drift.
 *
 * Stateless. No database. Status + latency logged inside the handler; never the body. (D6)
 */
import process from 'node:process'
import { handleNarrativeRequest } from '../src/agent/server.js'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'malformed_request' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const result = await handleNarrativeRequest(body, {
    apiKey: process.env.OPENAI_API_KEY,
    modelId: process.env.NARRATIVE_MODEL,
  })

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'content-type': 'application/json' },
  })
}
