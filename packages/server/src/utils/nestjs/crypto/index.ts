import { helper } from '@heyform-inc/utils'
const { isValid } = helper
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

interface AesKeyIvStruct {
  start: number
  value: Buffer
}

interface AesKeyIv {
  skey: AesKeyIvStruct
  siv: AesKeyIvStruct
}

const AES_KEY_SIZE = 32

function toB64Buffer(text: string): Buffer {
  return Buffer.from(text.replace(/\./g, '/'), 'base64')
}

function toHmacBuffer(text: string, key: string, algorithm = 'sha512'): Buffer {
  return crypto.createHmac(algorithm, key).update(text).digest()
}

function aesKeyIv(key: string, keyStart?: number, ivStart?: number): AesKeyIv {
  const buffer = toHmacBuffer(key, key)

  return {
    skey: getKeyIvStruct(buffer, AES_KEY_SIZE, keyStart),
    siv: getKeyIvStruct(buffer, AES_KEY_SIZE / 2, ivStart)
  }
}

function getKeyIvStruct(
  buffer: Buffer,
  size: number,
  start?: number
): AesKeyIvStruct {
  const len = buffer.length
  let index = 0

  if (isValid(start)) {
    index = start!
  } else {
    index = Math.floor(Math.random() * (len - size - 1))
  }

  return {
    start: index,
    value: buffer.slice(index, index + size)
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
  key: string,
  algorithm = 'aes-256-cbc'
): string {
  const { skey, siv } = aesKeyIv(key)
  const cipher = crypto.createCipheriv(algorithm, skey.value, siv.value)
  const encrypted = cipher.update(input)
  const pad = cipher.final()
  const base64Text = base64Encode(Buffer.concat([encrypted, pad]))

  return ['', skey.start.toString(16), siv.start.toString(16), base64Text].join(
    '$'
  )
}

export function aesDecrypt(
  input: string,
  key: string,
  algorithm = 'aes-256-cbc'
): string | undefined {
  try {
    const [, keyHex, ivHex, base64Text] = input.split('$')

    if (!keyHex || !ivHex || !base64Text) {
      return
    }

    const keyStart = parseInt(keyHex, 16)
    const ivStart = parseInt(ivHex, 16)
    const inputBuffer = toB64Buffer(base64Text)
    const { skey, siv } = aesKeyIv(key, +keyStart, +ivStart)
    const decipher = crypto.createDecipheriv(algorithm, skey.value, siv.value)
    const decrypted = decipher.update(inputBuffer)
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

export async function comparePassword(
  plaintext: string,
  encrypted: string
): Promise<boolean> {
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
