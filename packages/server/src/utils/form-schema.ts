import { FieldKindEnum, FormField, Logic } from '@heyform-inc/shared-types-enums'
import { BadRequestException, HttpStatus } from '@nestjs/common'

import {
  createFieldNavigation,
  flattenFields,
  getChoiceBranchingErrors,
  htmlUtils
} from '@heyform-inc/answer-utils'

const ALLOWED_BLOCK_TAGS = ['div', 'h1', 'h2', 'h3', 'p', 'br']
const ALLOWED_TAGS = [
  'text',
  'span',
  'bold',
  'strong',
  'code',
  'a',
  'b',
  'i',
  'u',
  's',
  'mention',
  'variable',
  'hiddenfield',
  ...ALLOWED_BLOCK_TAGS
]
const ALLOWED_ATTRIBUTES = [
  'href',
  'class',
  'data-mention',
  'data-variable',
  'data-hiddenfield',
  'contenteditable',
  'id'
]
const UNSAFE_URL_PROTOCOLS = new Set(['javascript', 'vbscript', 'data'])
const URL_PROTOCOL_CONTROL_CHARS_REGEX = /[\u0000-\u001f\u007f\s]+/g
const UNSAFE_CUSTOM_CSS_REGEX = /[<>\u0000]/
const UNSAFE_CSS_VALUE_REGEX = /[<>{};]/

function isUnsafeUrlProtocol(value: unknown): boolean {
  const matched = String(value || '')
    .trimStart()
    .match(/^([^:]+):/)

  if (!matched) {
    return false
  }

  const protocol = matched[1].replace(URL_PROTOCOL_CONTROL_CHARS_REGEX, '').toLowerCase()
  return UNSAFE_URL_PROTOCOLS.has(protocol)
}

function escapeText(value: unknown): string {
  return String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttribute(value: unknown): string {
  // Drafts pass through this sanitizer again on save and publish.
  return String(value)
    .replace(/&(?!(?:amp|quot|lt|gt);)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeAttributes(attributes: Record<string, any> = {}): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key of Object.keys(attributes)) {
    if (!ALLOWED_ATTRIBUTES.includes(key)) {
      continue
    }

    const value = String(attributes[key] || '')

    if (key === 'href' && isUnsafeUrlProtocol(value)) {
      continue
    }

    result[key] = escapeAttribute(value)
  }

  return result
}

function sanitizeRichTextNode(node: unknown): any[] | string | undefined {
  if (typeof node === 'string') {
    return escapeText(node)
  }

  if (!Array.isArray(node)) {
    return
  }

  const [tag, body, attributes] = node

  if (!ALLOWED_TAGS.includes(tag)) {
    return
  }

  const sanitizedBody = Array.isArray(body) ? body.map(sanitizeRichTextNode).filter(Boolean) : []
  const sanitizedAttributes = sanitizeAttributes(attributes)
  const sanitizedNode: any[] = [tag]

  if (sanitizedBody.length > 0) {
    sanitizedNode.push(sanitizedBody)
  }

  if (Object.keys(sanitizedAttributes).length > 0) {
    if (sanitizedBody.length < 1) {
      sanitizedNode.push([])
    }

    sanitizedNode.push(sanitizedAttributes)
  }

  return sanitizedNode
}

function sanitizeRichTextNodes(nodes: unknown[]): any[] {
  return nodes.map(sanitizeRichTextNode).filter(Boolean)
}

export function sanitizeRichTextSchema(value: unknown): any[] {
  if (Array.isArray(value)) {
    return sanitizeRichTextNodes(value)
  }

  if (typeof value === 'string') {
    return sanitizeRichTextNodes(htmlUtils.parse(value))
  }

  return []
}

function sanitizeField(field: Record<string, any>): Record<string, any> {
  const sanitized = {
    ...field
  }

  for (const key of ['title', 'titleSchema', 'description']) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = sanitizeRichTextSchema(sanitized[key])
    }
  }

  if (Array.isArray(sanitized.properties?.fields)) {
    sanitized.properties = {
      ...sanitized.properties,
      fields: sanitized.properties.fields.map(sanitizeField)
    }
  }

  return sanitized
}

export function sanitizeFormDrafts(drafts: any[]): any[] {
  return drafts.map(sanitizeField)
}

function hasNextFieldIds(fields: FormField[] = []): boolean {
  return fields.some(
    field => field.nextFieldId != null || hasNextFieldIds(field.properties?.fields)
  )
}

export function assertValidFormNavigation(drafts: FormField[]): void {
  // Forms without explicit destinations navigate in form order as before, so
  // leave their existing structure alone.
  if (!hasNextFieldIds(drafts)) {
    return
  }

  // The renderer supports one group level. Reject unsupported nesting instead
  // of accepting destinations that neither renderer nor submission can traverse.
  for (const field of drafts) {
    if (field.properties?.fields?.some(child => child.kind === FieldKindEnum.GROUP)) {
      throw new BadRequestException('Nested question groups are not supported')
    }
  }
  const fields = flattenFields(drafts, true)
  const navigation = createFieldNavigation(fields)
  const ids = new Set<string>()

  for (const field of fields) {
    if (ids.has(field.id)) {
      throw new BadRequestException('Field IDs must be unique')
    }
    ids.add(field.id)
    if (
      field.nextFieldId != null &&
      (typeof field.nextFieldId !== 'string' ||
        !navigation.isValidNextFieldId(field.id, field.nextFieldId))
    ) {
      throw new BadRequestException(
        'The next question must be a later question or ending in this form'
      )
    }
  }
}

// Drafts may be mid-edit, so this only runs when publishing.
export function assertValidChoiceBranching(drafts: FormField[], logics?: Logic[]): void {
  const fields = flattenFields(drafts, true)
  const [error] = getChoiceBranchingErrors(fields, logics)

  if (error) {
    const field = fields.find(f => f.id === error.fieldId)
    // Sanitized drafts store titles as rich-text schemas rather than HTML.
    const html = Array.isArray(field?.title)
      ? htmlUtils.serialize(field!.title)
      : String(field?.title || '')
    const title = htmlUtils.plain(html).trim() || error.fieldId

    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'invalid_choice_branching',
      message: `"${title}" branches by answer, so it must be required, single-select without "Other", and every option needs a destination`,
      fieldId: error.fieldId,
      code: error.code
    })
  }
}

export function isSafeCustomCSS(value?: string): boolean {
  if (value === undefined || value === null || value === '') {
    return true
  }

  return !UNSAFE_CUSTOM_CSS_REGEX.test(value)
}

export function isSafeCSSValue(value?: string): boolean {
  if (value === undefined || value === null || value === '') {
    return true
  }

  return !UNSAFE_CSS_VALUE_REGEX.test(value) && !value.includes('\u0000')
}
