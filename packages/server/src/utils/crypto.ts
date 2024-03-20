import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

import { helper } from '@heyform-inc/utils'

const AES_KEY_SIZE = 32

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
