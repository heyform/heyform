import slug from 'slugify'

export function slugify(text: string): string {
  return slug(text)
}
