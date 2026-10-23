/**
 * Re-encrypts stored integration credentials (connection tokens, API keys)
 * that still use INTEGRATION_ENCRYPTION_KEY_PREVIOUS with the current
 * INTEGRATION_ENCRYPTION_KEY, so the previous key can be removed. Run it with
 * the same environment as the server, after restarting it with both keys:
 *
 *   node dist/src/cli/reencrypt-integration-secrets.js   (built server, e.g. Docker)
 *   pnpm integrations:reencrypt                         (source checkout)
 */
import * as mongoose from 'mongoose'

import { MongoService } from '../config/mongo'
import { IntegrationConnectionSchema } from '../model/integration-connection.model'
import { IntegrationSchema } from '../model/integration.model'
import { reencryptIntegrationSecrets } from '../service/integration-secrets'

async function main() {
  const { uri, ...options } = (await new MongoService().createMongooseOptions()) as any
  // Only reads and updates documents; the server builds the indexes
  const connection = await mongoose
    .createConnection(uri, { ...options, autoIndex: false })
    .asPromise()

  try {
    const result = await reencryptIntegrationSecrets({
      connectionModel: connection.model('IntegrationConnectionModel', IntegrationConnectionSchema),
      integrationModel: connection.model('IntegrationModel', IntegrationSchema)
    })

    process.stdout.write(
      `Re-encrypted ${result.reencrypted}, skipped ${result.skipped} that changed meanwhile, ` +
        `${result.unreadable} readable with neither key (they need reconnecting).\n`
    )

    // A changed value was re-encrypted by whoever changed it; running again
    // confirms nothing is left on the previous key
    if (result.skipped) {
      process.stdout.write('Run it again to check that nothing is left on the previous key.\n')
    }
  } finally {
    await connection.close()
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
  process.exitCode = 1
})
