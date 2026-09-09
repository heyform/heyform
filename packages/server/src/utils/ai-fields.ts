import {
  FORM_FIELD_KINDS,
  FieldKindEnum,
  FieldLayoutAlignEnum
} from '@heyform-inc/shared-types-enums'
import { z } from 'zod/v4'

import { nanoid } from '@heyform-inc/utils'

import { normalizeAIRichText } from './ai-rich-text'

type JsonObject = Record<string, unknown>

// Invalid optional scalars are discarded, without coercing AI-generated values.
const optionalString = z.string().optional().catch(undefined)
const optionalBoolean = z.boolean().optional().catch(undefined)
const optionalNumber = z.number().optional().catch(undefined)

function object(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}
}

function omitUndefined<T extends JsonObject>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T
}

const identifiedItemSchema = z.object({
  id: optionalString,
  label: z.string({ error: 'AI choices and columns must have labels' })
})

function identifiedItems(schema: z.ZodObject) {
  return z
    .array(
      z.preprocess(value => (typeof value === 'string' ? { label: value } : object(value)), schema),
      { error: 'Expected AI choices or columns to be an array' }
    )
    .transform(items => {
      const ids = new Set<string>()
      return items.map(item => {
        const result = omitUndefined(item) as JsonObject
        if (!result.id || ids.has(result.id as string)) {
          result.id = nanoid(12)
        }
        ids.add(result.id as string)
        return result
      })
    })
}

// Keep these schemas aligned with FormFieldInput and its nested GraphQL input types.
const propertiesSchema = z.preprocess(
  object,
  z
    .object({
      showButton: optionalBoolean,
      buttonText: optionalString,
      hideMarks: optionalBoolean,
      allowOther: optionalBoolean,
      allowMultiple: optionalBoolean,
      badge: optionalString,
      verticalAlignment: optionalBoolean,
      randomize: optionalBoolean,
      choiceStyle: optionalString,
      other: optionalString,
      numberPreRow: optionalNumber,
      shape: optionalString,
      total: optionalNumber,
      start: optionalNumber,
      leftLabel: optionalString,
      centerLabel: optionalString,
      rightLabel: optionalString,
      defaultCountryCode: optionalString,
      currency: optionalString,
      format: optionalString,
      allowTime: optionalBoolean,
      use12Hours: optionalBoolean,
      score: optionalNumber,
      sourceUrl: optionalString,
      buttonLinkUrl: optionalString,
      redirectUrl: optionalString,
      redirectOnCompletion: optionalBoolean,
      redirectDelay: optionalNumber,
      choices: identifiedItems(
        identifiedItemSchema.extend({
          image: optionalString,
          color: optionalString,
          score: optionalNumber,
          isExpected: optionalBoolean
        })
      ).nullish(),
      tableColumns: identifiedItems(
        identifiedItemSchema.extend({ type: optionalString, required: optionalBoolean })
      ).nullish(),
      price: z
        .preprocess(
          object,
          z
            .object({
              type: z.string({ error: 'AI price must have a type' }),
              value: optionalNumber,
              ref: optionalString
            })
            .transform(omitUndefined)
        )
        .nullish(),
      // Normalize descendants separately so parents reserve their IDs first.
      fields: z.array(z.unknown(), { error: 'AI fields must be a nonempty array' }).nullish(),
      // Older prompts put legal text here; it is migrated to description below.
      html: z.unknown().optional()
    })
    .transform(omitUndefined)
)

const validationsSchema = z.preprocess(
  object,
  z
    .object({
      required: optionalBoolean,
      min: optionalNumber,
      max: optionalNumber,
      matchExpected: optionalBoolean
    })
    .transform(omitUndefined)
)

const layoutSchema = z.preprocess(
  object,
  z
    .object({
      mediaType: z.enum(['image', 'video']).optional().catch(undefined),
      mediaUrl: optionalString,
      backgroundColor: optionalString,
      brightness: optionalNumber.transform(value =>
        value === undefined ? undefined : Math.max(-100, Math.min(100, value))
      ),
      align: z.enum(FieldLayoutAlignEnum).optional().catch(undefined)
    })
    .transform(omitUndefined)
)

const fieldSchema = z.preprocess(
  object,
  z
    .object({
      id: optionalString,
      kind: z.enum(FORM_FIELD_KINDS as [FieldKindEnum, ...FieldKindEnum[]], {
        error: 'Unsupported AI field kind'
      }),
      width: optionalNumber,
      hide: optionalBoolean,
      frozen: optionalBoolean,
      title: z.unknown().optional(),
      description: z.unknown().optional(),
      validations: validationsSchema,
      properties: propertiesSchema,
      layout: layoutSchema.nullish()
    })
    .transform(omitUndefined)
)

const fieldsSchema = z
  .array(fieldSchema, { error: 'AI fields must be a nonempty array' })
  .min(1, { error: 'AI fields must be a nonempty array' })

export function normalizeAIFields(value: unknown, ids = new Set<string>()): JsonObject[] {
  return fieldsSchema.parse(value).map(field => {
    if (!field.id || ids.has(field.id)) {
      field.id = nanoid(12)
    }
    ids.add(field.id)
    const title = normalizeAIRichText(field.title)
    let description = normalizeAIRichText(field.description)
    const { html, fields, choices, tableColumns, price, ...properties } = field.properties
    if (field.kind === FieldKindEnum.LEGAL_TERMS && description.length === 0) {
      description = normalizeAIRichText(html)
    }
    return {
      ...field,
      title,
      description,
      properties: {
        ...properties,
        ...(choices != null ? { choices } : {}),
        ...(tableColumns != null ? { tableColumns } : {}),
        ...(price != null ? { price } : {}),
        ...(fields != null ? { fields: fields.length ? normalizeAIFields(fields, ids) : [] } : {})
      },
      layout: field.layout ?? null
    }
  })
}
