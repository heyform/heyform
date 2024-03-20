import { helper } from '@heyform-inc/utils'
import { parse as html5Parse } from 'html5parser'
import { IAttribute } from 'html5parser/src/types'

interface HTMLWalkOptions {
  allowedTags?: string[]
  allowedBlockTags?: string[]
  allowedAttributes?: string[]
  plain?: boolean
  livePreview?: boolean
}

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
  'variable'
]
const ALLOWED_ATTRIBUTES = [
  'href',
  'class',
  'data-mention',
  'data-variable',
  'contenteditable',
  'style'
]

function getAttributes(row: IAttribute[], allowedAttributes: string[] = []): Record<string, any> {
  const result: Record<string, any> = {}

  if (helper.isValidArray(row)) {
    row.forEach(a => {
      const name = a.name.value.toLowerCase()

      if (allowedAttributes.includes(name)) {
        result[name] = a.value?.value
      }
    })
  }

  return result
}

function walk(node: any, option: HTMLWalkOptions): any[] | string | undefined {
  let tag = (node.name || node.type).toLowerCase()
  const allowedTags = option.allowedTags!.concat(option.allowedBlockTags || ALLOWED_BLOCK_TAGS)

  if (allowedTags.includes(tag)) {
    const text = node.value

    if (tag === 'text') {
      return text
    }

    let attributes = getAttributes(node.attributes, option.allowedAttributes)

    if (tag === 'span') {
      const mentionId = attributes['data-mention']
      const variableId = attributes['data-variable']

      if (helper.isValid(mentionId)) {
        tag = 'mention'
        attributes = {
          id: mentionId
        }
      } else if (helper.isValid(variableId)) {
        tag = 'variable'
        attributes = {
          id: variableId
        }
      }
    }

    const schema: any[] = [tag]

    if (helper.isValidArray(node.body)) {
      const body = node.body!.map((child: any) => walk(child, option))

      if (helper.isValidArray(body)) {
        schema.push(body)
      }
    }

    if (helper.isValid(attributes)) {
      schema.push(attributes)
    }

    return schema
  }
}

// Purge illegal html tag and attributes
function purge(html: string, option?: HTMLWalkOptions): string {
  const schemas = parse(html, option)
  return serialize(schemas, option)
}

// HTML string to schema
function parse(html: string, option?: HTMLWalkOptions): any[] {
  if (helper.isEmpty(html)) {
    return []
  }

  const result = html5Parse(html)
  const customOption: HTMLWalkOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    ...option
  }

  return result.map((node: any) => walk(node, customOption)).filter(Boolean)
}

// HTML schema to HTML string
function serialize(schemas?: any[], option?: HTMLWalkOptions): string {
  if (!helper.isValidArray(schemas)) {
    return ''
  }

  const customOption: HTMLWalkOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    ...option
  }

  const allowedTags = customOption.allowedTags!.concat(
    customOption.allowedBlockTags || ALLOWED_BLOCK_TAGS
  )

  return schemas!
    .map(schema => {
      if (helper.isString(schema)) {
        return schema
      }

      if (!helper.isValidArray(schema)) {
        return ''
      }

      let [tag, body, attributes] = schema

      if (
        !allowedTags.includes(tag) ||
        // Only allows empty br node
        (helper.isEmpty(body) && helper.isEmpty(attributes) && tag !== 'br')
      ) {
        return ''
      }

      if (customOption.plain) {
        return serialize(body!, customOption)
      }

      if (tag === 'br') {
        return '<br />'
      }

      let property = ''

      if (helper.isValid(attributes)) {
        if (tag === 'mention') {
          attributes = {
            class: 'mention',
            contenteditable: 'false',
            'data-mention': attributes.id
          }
        } else if (tag === 'variable') {
          attributes = {
            class: 'variable',
            contenteditable: 'false',
            'data-variable': attributes.id
          }
        }

        property = Object.keys(attributes!)
          .filter(key => customOption.allowedAttributes!.includes(key))
          .map(key => ` ${key}="${attributes![key]}"`)
          .join('')
      }

      if (tag === 'mention' || tag === 'variable') {
        tag = 'span'

        // Placeholder for live preview
        if (customOption.livePreview) {
          body = ['_____']
        }
      }

      return `<${tag}${property}>${serialize(body!, customOption)}</${tag}>`
    })
    .join('')
}

// HTML to plain text
function plain(html: string, limit = 0) {
  if (helper.isEmpty(html)) {
    return ''
  }

  const result = html
    .replace(/<style[^<>]*>((?!<\/).)*<\/style>/gi, '')
    .replace(/<script[^<>]*>((?!<\/).)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  if (limit > 0) {
    let sliced = result.slice(0, limit)

    if (result.length > limit) {
      sliced += '...'
    }

    return sliced
  }

  return result
}

export const htmlUtils = {
  parse,
  serialize,
  purge,
  plain
}
