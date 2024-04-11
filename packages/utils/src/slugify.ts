import slug from 'slugify'

export interface SlugifyOptions {
  replacement?: string
  remove?: RegExp
  lower?: boolean
  strict?: boolean
  locale?: string
  trim?: boolean
}

export function slugify(text: string, options?: SlugifyOptions): string {
  return slug(text, {
    replacement: '_',
    lower: true,
    ...options
  })
}
