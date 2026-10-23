import { INTEGRATION_ENCRYPTION_KEY, INTEGRATION_ENCRYPTION_KEY_PREVIOUS } from '@environments'
import { decryptSecret, encryptSecret, secretKeyId } from '@utils'

// Neither key can decrypt the value, or it's not one of ours
export class IntegrationSecretError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IntegrationSecretError'
  }
}

/**
 * Encrypts integration credentials with INTEGRATION_ENCRYPTION_KEY. Each value
 * is prefixed with the id of the key that encrypted it (`<keyId>:<value>`), so
 * after a rotation, values written with INTEGRATION_ENCRYPTION_KEY_PREVIOUS
 * are still read, and can be found and re-encrypted. Writes always use the
 * current key.
 */
export class IntegrationSecrets {
  private readonly keys: Array<{ id: string; secret: string }>

  constructor(
    private readonly current?: string,
    previous?: string
  ) {
    this.keys = [current, previous]
      .filter((secret): secret is string => !!secret)
      .map(secret => ({ id: secretKeyId(secret), secret }))
  }

  // Without a current key, apps that store credentials are unavailable
  get isConfigured(): boolean {
    return !!this.current
  }

  get currentKeyId(): string | undefined {
    return this.current ? this.keys[0].id : undefined
  }

  encrypt(plaintext: string): string {
    if (!this.current) {
      throw new IntegrationSecretError('INTEGRATION_ENCRYPTION_KEY is not set')
    }

    return `${this.keys[0].id}:${encryptSecret(plaintext, this.current)}`
  }

  decrypt(value: string): string {
    const separator = String(value).indexOf(':')
    const keyId = separator > 0 ? String(value).slice(0, separator) : undefined
    const key = this.keys.find(row => row.id === keyId)

    if (!key) {
      throw new IntegrationSecretError(
        'Encrypted with a key that is neither INTEGRATION_ENCRYPTION_KEY nor INTEGRATION_ENCRYPTION_KEY_PREVIOUS'
      )
    }

    try {
      return decryptSecret(String(value).slice(separator + 1), key.secret)
    } catch (_) {
      throw new IntegrationSecretError('The encrypted value is damaged')
    }
  }
}

export const integrationSecrets = new IntegrationSecrets(
  INTEGRATION_ENCRYPTION_KEY,
  INTEGRATION_ENCRYPTION_KEY_PREVIOUS
)

export interface ReencryptionResult {
  // Values moved to the current key
  reencrypted: number
  // Changed meanwhile (e.g. refreshed, which re-encrypts them anyway)
  skipped: number
  // Readable with neither key; they need reconnecting
  unreadable: number
}

interface ReencryptionModels {
  connectionModel: { find(filter: any): any; updateOne(filter: any, update: any): any }
  integrationModel: { find(filter: any): any; updateOne(filter: any, update: any): any }
}

/**
 * Re-encrypts with the current key every stored credential still on
 * INTEGRATION_ENCRYPTION_KEY_PREVIOUS: connection tokens and API keys. Each
 * update only applies if the value hasn't changed since it was read. Safe to
 * run while the server runs, and to run again.
 */
export async function reencryptIntegrationSecrets(
  { connectionModel, integrationModel }: ReencryptionModels,
  secrets: IntegrationSecrets = integrationSecrets
): Promise<ReencryptionResult> {
  if (!secrets.isConfigured) {
    throw new IntegrationSecretError('INTEGRATION_ENCRYPTION_KEY is not set')
  }

  const result: ReencryptionResult = { reencrypted: 0, skipped: 0, unreadable: 0 }

  for (const connection of await connectionModel.find({}).lean()) {
    const stored: Record<string, any> = mapEntries(connection.tokens)
    const fields = ['accessToken', 'refreshToken'].filter(
      field => stored[field] && !String(stored[field]).startsWith(`${secrets.currentKeyId}:`)
    )

    if (!fields.length) {
      continue
    }

    let tokens: Record<string, any>

    try {
      tokens = { ...stored }

      for (const field of fields) {
        tokens[field] = secrets.encrypt(secrets.decrypt(stored[field]))
      }
    } catch (_) {
      result.unreadable++
      continue
    }

    const update = await connectionModel.updateOne(
      { _id: connection._id, tokenVersion: connection.tokenVersion ?? 0 },
      { $set: { tokens }, $inc: { tokenVersion: 1 } }
    )
    result[update.modifiedCount > 0 ? 'reencrypted' : 'skipped']++
  }

  for (const integration of await integrationModel
    .find({ apiKey: { $exists: true, $ne: null } })
    .lean()) {
    if (String(integration.apiKey).startsWith(`${secrets.currentKeyId}:`)) {
      continue
    }

    let apiKey: string

    try {
      apiKey = secrets.encrypt(secrets.decrypt(integration.apiKey))
    } catch (_) {
      result.unreadable++
      continue
    }

    const update = await integrationModel.updateOne(
      { _id: integration._id, apiKey: integration.apiKey },
      { $set: { apiKey } }
    )
    result[update.modifiedCount > 0 ? 'reencrypted' : 'skipped']++
  }

  return result
}

function mapEntries(value: any): Record<string, any> {
  if (!value) {
    return {}
  }

  return value instanceof Map ? Object.fromEntries(value) : { ...value }
}
