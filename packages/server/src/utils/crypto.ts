import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

import { helper } from '@heyform-inc/utils'

const AES_KEY_SIZE = 32
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

function toB64Buffer(text: string): Buffer {
  return Buffer.from(text.replace(/\./g, '/'), 'base64')
}

function toHmacBuffer(text: string, key: string, algorithm = 'sha512'): Buffer {
  return crypto.createHmac(algorithm, key).update(text).digest()
}

function getKeyIv(secret: string) {
  const buffer = toHmacBuffer(secret, secret)

  return {
    key: buffer.subarray(0, AES_KEY_SIZE),
    iv: buffer.subarray(-AES_KEY_SIZE / 2 - 1, -1)
  }
}

export function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex')
}

export function base64Encode(input: string | Buffer): string {
  const inputBuffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return inputBuffer.toString('base64').replace(/\//g, '.')
}

export function base64Decode(text: string): string {
  return toB64Buffer(text).toString('utf8')
}

export function hmac(text: string, key: string, algorithm = 'sha512'): string {
  return toHmacBuffer(text, key, algorithm).toString('base64')
}

export function aesEncrypt(
  input: crypto.BinaryLike,
  secret: string,
  algorithm = 'aes-256-cbc'
): string {
  const { key, iv } = getKeyIv(secret)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = cipher.update(input)
  const pad = cipher.final()
  const totalLength = encrypted.length + pad.length

  return base64Encode(Buffer.concat([encrypted, pad], totalLength))
}

export function aesDecrypt(
  input: string,
  secret: string,
  algorithm = 'aes-256-cbc'
): string | undefined {
  try {
    const { key, iv } = getKeyIv(secret)
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    const decrypted = decipher.update(toB64Buffer(input))
    const pad = decipher.final()

    return Buffer.concat([decrypted, pad]).toString('utf8')
  } catch (err) {
    throw err
  }
}

export async function passwordHash(
  password: string,
  saltOrRounds: string | number = 10
): Promise<string> {
  return bcrypt.hash(password, saltOrRounds)
}

export async function comparePassword(plaintext: string, encrypted: string): Promise<boolean> {
  return bcrypt.compare(plaintext, encrypted)
}

export function isPasswordHash(value: unknown): value is string {
  return typeof value === 'string' && BCRYPT_HASH_PATTERN.test(value)
}

export function aesEncryptObject(
  input: Record<string, any>,
  key: string,
  algorithm = 'aes-256-cbc'
): string {
  return aesEncrypt(JSON.stringify(input), key, algorithm)
}

export function aesDecryptObject(
  input: string,
  key: string,
  algorithm = 'aes-256-cbc'
): Record<string, any> | undefined {
  const decrypted = aesDecrypt(input, key, algorithm)

  if (helper.isValid(decrypted)) {
    return JSON.parse(decrypted!)
  }
}

const SECRET_VERSION = 'v1'
const SECRET_TAG_LENGTH = 16
const SECRET_KEY_INFO = 'heyform:stored-secret'

function storedSecretKey(secret: string): Buffer {
  if (helper.isEmpty(secret)) {
    throw new Error('An encryption key is required to store secrets')
  }

  return Buffer.from(crypto.hkdfSync('sha256', secret, Buffer.alloc(0), SECRET_KEY_INFO, 32))
}

/**
 * A short, stable id for a key, so stored values can say which key encrypted
 * them. It's a fingerprint of the derived key, not the key itself.
 */
export function secretKeyId(secret: string): string {
  return crypto.createHash('sha256').update(storedSecretKey(secret)).digest('hex').slice(0, 8)
}

/**
 * Encrypts a credential (API key, OAuth token) for storage. Unlike
 * aesEncrypt(), which derives a fixed IV from the key, every call uses a fresh
 * random IV and AES-GCM, so equal inputs give different outputs and tampered
 * values fail to decrypt.
 */
export function encryptSecret(plaintext: string, secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', storedSecretKey(secret), iv, {
    authTagLength: SECRET_TAG_LENGTH
  })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

  return [
    SECRET_VERSION,
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    encrypted.toString('base64')
  ].join('.')
}

// Throws if the value was not made by encryptSecret() with the same key
export function decryptSecret(value: string, secret: string): string {
  const [version, iv, tag, encrypted] = String(value).split('.')

  if (version !== SECRET_VERSION || !iv || !tag || encrypted === undefined) {
    throw new Error('Invalid encrypted secret')
  }

  const authTag = Buffer.from(tag, 'base64')

  // A shorter tag would be easier to forge
  if (authTag.length !== SECRET_TAG_LENGTH) {
    throw new Error('Invalid encrypted secret')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    storedSecretKey(secret),
    Buffer.from(iv, 'base64'),
    { authTagLength: SECRET_TAG_LENGTH }
  )
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final()
  ]).toString('utf8')
}
