import db from './mime-db.json'
import { isEmpty, isString } from './helper'

export function mime(path: string) {
  if (isEmpty(path) || !isString(path) || path.length > 100) {
    return
  }

  // Fork from https://github.com/broofa/mime/blob/a34dac529c2aaf2a0bc5ff8be26f983795d0a5e9/src/Mime.ts#L73
  // Remove chars preceeding `/` or `\`
  const last = path.replace(/^.*[/\\]/, '').toLowerCase()

  // Remove chars preceeding '.'
  const ext = last.replace(/^.*\./, '').toLowerCase()

  const hasPath = last.length < path.length
  const hasDot = ext.length < last.length - 1

  // Extension-less file?
  if (!hasDot && hasPath) {
    return
  }

  return (db as Record<string, string>)[ext]
}

export const commonImageMimeTypes = [
  mime('.jpg'),
  mime('.png'),
  mime('.bmp'),
  mime('.webp'),
  mime('.gif')
] as unknown as string[]

export const commonFileMimeTypes = [
  ...commonImageMimeTypes,
  mime('.txt'),
  mime('.md'),
  mime('.doc'),
  mime('.docx'),
  mime('.xls'),
  mime('.xlsx'),
  mime('.csv'),
  mime('.ppt'),
  mime('.pptx'),
  mime('.pdf'),
  mime('.mp4'),
  mime('.wmv'),
  mime('.svg')
] as unknown as string[]

export const IMAGE_MIME_TYPES = commonImageMimeTypes
export const FILE_MIME_TYPES = commonFileMimeTypes
