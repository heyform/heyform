import { config } from 'dotenv'
import { existsSync } from 'fs'
import { basename, join, posix } from 'path'

export const isWindows = typeof process !== 'undefined' && process.platform === 'win32'

const WINDOWS_SLASH_REGEX = /\\/g

export function slash(p: string): string {
  return p.replace(WINDOWS_SLASH_REGEX, '/')
}

export function normalizePath(id: string): string {
  return posix.normalize(isWindows ? slash(id) : id)
}

export function getEnvFilesForMode(mode: string, envDir: string): string[] {
  return [
    /** default file */ `.env`,
    /** local file */ `.env.local`,
    /** mode file */ `.env.${mode}`,
    /** mode local file */ `.env.${mode}.local`
  ].map(file => normalizePath(join(envDir, file)))
}

export function loadEnv(mode: string, envDir: string): void {
  const envFiles = getEnvFilesForMode(mode, envDir)

  for (const path of envFiles) {
    if (existsSync(path)) {
      config({ path })
      console.log('[Env] %s', basename(path))
    }
  }
}
