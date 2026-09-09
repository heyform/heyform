import { z } from 'zod/v4'

import { htmlUtils } from '@heyform-inc/answer-utils'

import { sanitizeRichTextSchema } from './form-schema'

const MAX_RICH_TEXT_DEPTH = 32

const attributeValueSchema = z
  .union([z.string(), z.number(), z.boolean()], {
    error: 'Invalid AI rich-text attribute value'
  })
  .nullish()
const attributesSchema = z
  .unknown()
  .refine(value => value == null || !Object.prototype.hasOwnProperty.call(value, '__proto__'), {
    error: 'Invalid AI rich-text attribute value'
  })
  .pipe(
    z
      .record(z.string(), attributeValueSchema, {
        error: 'Invalid AI rich-text attributes'
      })
      .nullish()
  )
  .transform(attributes =>
    Object.fromEntries(
      Object.entries(attributes || {})
        .filter(([, value]) => value != null)
        .map(([key, value]) => [key, String(value)])
    )
  )

// Recover the compact tuples emitted by the HTML parser before Zod validates them.
function expandNode(value: unknown): unknown {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) return value
  let [, body, attributes] = value
  if (value.length === 2 && body && typeof body === 'object' && !Array.isArray(body)) {
    attributes = body
    body = []
  }
  return [value[0], body, attributes]
}

function createNodesSchema(depth: number): z.ZodType<unknown[]> {
  if (depth > MAX_RICH_TEXT_DEPTH) {
    return z.never({ error: 'AI rich text exceeds maximum nesting depth' })
  }

  const childrenSchema = z.preprocess(
    value => (typeof value === 'string' ? [value] : (value ?? [])),
    createNodesSchema(depth + 1)
  )
  const nodeSchema = z.preprocess(
    expandNode,
    z.tuple([z.string(), childrenSchema, attributesSchema])
  )
  return z
    .array(z.union([z.string(), nodeSchema]).nullish())
    .transform(nodes => nodes.filter(node => node != null))
}

const richTextSchema = z.preprocess(
  value => (typeof value === 'string' ? htmlUtils.parse(value) : (value ?? [])),
  createNodesSchema(0)
)

export function normalizeAIRichText(value: unknown): unknown[] {
  const result = richTextSchema.safeParse(value)
  if (!result.success) {
    throw new Error('Invalid AI rich-text structure: ' + result.error.message)
  }
  return sanitizeRichTextSchema(result.data)
}
