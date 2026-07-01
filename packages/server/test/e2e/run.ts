/* eslint-disable no-console */
import { build as buildAuthFlows } from './auth-flows.e2e.test'
import { build as buildAuth } from './auth.e2e.test'
import { build as buildCatalog } from './catalog.e2e.test'
import { build as buildHealth } from './health.e2e.test'
import { runSuites } from './helpers/runner'
import { waitForReady } from './helpers/wait'
import { build as buildInputValidation } from './input-validation.e2e.test'
import { build as buildPermissionMatrix } from './permission-matrix.e2e.test'
import { build as buildRateLimit } from './rate-limit.e2e.test'
import { build as buildStatefulEdges } from './stateful-edges.e2e.test'
import { build as buildTeamFlow } from './team-flow.e2e.test'

async function main() {
  const baseUrl = process.env.E2E_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:9157'
  const skipWait = process.env.E2E_SKIP_WAIT === '1'
  const onlyFilter = process.env.E2E_ONLY // e.g. "auth,health"

  console.log(`Logisaar Forms server e2e — target: ${baseUrl}`)

  if (!skipWait) {
    const waitMs = Number(process.env.E2E_WAIT_MS || 60_000)
    process.stdout.write(`Waiting up to ${waitMs}ms for /health/ready … `)
    try {
      await waitForReady(baseUrl, waitMs)
      console.log('ready.')
    } catch (err) {
      console.log('FAILED.')
      console.error(err instanceof Error ? err.message : err)
      console.error(
        '\nHint: start the test stack with' +
          '\n  docker compose -f docker-compose.test.yml up -d --build heyform' +
          '\nor point E2E_BASE_URL at an already-running server.'
      )
      process.exit(2)
    }
  }

  const allSuites = [
    buildHealth(baseUrl),
    buildAuth(baseUrl),
    buildCatalog(baseUrl),
    buildInputValidation(baseUrl),
    buildAuthFlows(baseUrl),
    buildStatefulEdges(baseUrl),
    buildTeamFlow(baseUrl),
    buildPermissionMatrix(baseUrl),
    // Rate-limit suite intentionally last — it burns per-user attempt counters.
    buildRateLimit(baseUrl)
  ]

  const suites = onlyFilter
    ? allSuites.filter(s => onlyFilter.split(',').some(name => s.name.includes(name.trim())))
    : allSuites

  if (suites.length === 0) {
    console.error(
      `No suites matched filter "${onlyFilter}". Available: ${allSuites.map(s => s.name).join(', ')}`
    )
    process.exit(2)
  }

  const result = await runSuites(suites)
  process.exit(result.failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('e2e runner crashed:', err)
  process.exit(2)
})
