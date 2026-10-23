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
