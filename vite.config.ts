import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Local dev adapter for /api/narrative — the SAME handler the Vercel function uses
 * (src/agent/server.ts), so dev and prod cannot drift. Loaded through Vite's SSR module
 * loader for TS + HMR. Without a key in .env the handler returns 503 and the app's manual
 * path keeps working — the assistant is optional by design.
 */
function narrativeDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'surepath-narrative-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/narrative', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'method_not_allowed' }))
          return
        }
        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', () => {
          void (async () => {
            let body: unknown
            try {
              body = JSON.parse(raw)
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'malformed_request' }))
              return
            }
            try {
              const mod = (await server.ssrLoadModule('/src/agent/server.ts')) as {
                handleNarrativeRequest: (
                  body: unknown,
                  env: { apiKey?: string; modelId?: string },
                ) => Promise<{ status: number; body: Record<string, unknown> }>
              }
              const result = await mod.handleNarrativeRequest(body, {
                apiKey: env.ANTHROPIC_API_KEY,
                modelId: env.NARRATIVE_MODEL,
              })
              res.statusCode = result.status
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(result.body))
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'assistant_unavailable' }))
            }
          })()
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), narrativeDevApi(env)],
  }
})
