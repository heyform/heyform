import { htmlUtils } from '@heyform-inc/answer-utils'
import {
  FORM_FIELD_KINDS,
  FieldKindEnum,
  Logic,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper, nanoid } from '@heyform-inc/utils'

import type { FormField } from '@/models'

import { getValidLogics } from './logic'

// TODO: remove in future
const DISCARD_FIELD_KINDS = ['single_choice', 'dropdown']
const FIELD_KINDS = [...DISCARD_FIELD_KINDS, ...FORM_FIELD_KINDS]

export function serializeFields(rawFields: FormField[]) {
  let questions: Partial<FormField>[] = []
  let index = 1

  const fields = rawFields.map(f => {
    if (helper.isArray(f.title)) {
      f.title = htmlUtils.serialize(f.title)
    }

    if (helper.isArray(f.description)) {
      f.description = htmlUtils.serialize(f.description)
    }

    // Add index to fields
    if (QUESTION_FIELD_KINDS.includes(f.kind)) {
      f.index = index++

      if (f.kind === FieldKindEnum.GROUP) {
        const children = f.properties?.fields || []
        const { questions: nestedQuestions, fields: nestedFields } = serializeFields(children)

        f.properties = {
          ...f.properties,
          fields: nestedFields
        }

        questions = [...questions, ...nestedQuestions]
      } else {
        questions.push({
          id: f.id,
          kind: f.kind,
          title: htmlUtils.plain(f.title!)
        })
      }
    }

    return f
  })

  return {
    questions,
    fields
  }
}

export function initFields(rawFields?: FormField[], rawLogics?: Logic[]) {
  let list = rawFields?.filter(f => FIELD_KINDS.includes(f.kind)) || []

  if (list.length > 0) {
    list = list.map((f: any) => {
      f.title = f.titleSchema || f.title

      if (DISCARD_FIELD_KINDS.includes(f.kind)) {
        f.kind = FieldKindEnum.MULTIPLE_CHOICE
      }

      return f
    })
  }

  const { fields, questions } = serializeFields(list)
  const selectedField = fields[0]
  const selectedId = selectedField?.id
  const logics = getValidLogics(fields, rawLogics)

  return {
    fields,
    questions,
    selectedField,
    selectedId,
    logics
  }
}

export function getFieldFromKind(kind: FieldKindEnum | string): FormField {
  const field: FormField = {
    id: nanoid(12),
    kind: kind as FieldKindEnum,
    title: '',
    description: '',
    validations: {},
    properties: {}
  }

  switch (kind) {
    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      field.properties!.allowMultiple = false
      field.properties!.choices = [
        {
          id: nanoid(12),
          label: ''
        }
      ]
      break

    case FieldKindEnum.RATING:
      field.properties!.total = 5
      field.properties!.shape = 'star'
      break

    case FieldKindEnum.OPINION_SCALE:
      field.properties!.total = 10
      break

    case FieldKindEnum.YES_NO:
      field.properties!.choices = [
        {
          id: nanoid(12),
          label: 'Yes'
        },
        {
          id: nanoid(12),
          label: 'No'
        }
      ]
      break

    case FieldKindEnum.DATE:
    case FieldKindEnum.DATE_RANGE:
      field.properties!.format = 'MM/DD/YYYY'
      field.properties!.allowTime = false
      break

    case FieldKindEnum.PHONE_NUMBER:
      field.properties!.defaultCountryCode = 'US'
      break

    case FieldKindEnum.INPUT_TABLE:
      field.properties!.tableColumns = [
        {
          id: nanoid(12),
          label: ''
        },
        {
          id: nanoid(12),
          label: ''
        }
      ]
      break

    case FieldKindEnum.PAYMENT:
      field.properties!.currency = 'USD'
      field.properties!.price = {
        type: 'number',
        value: 0
      }
      break

    case FieldKindEnum.GROUP:
      field.properties!.fields = [getFieldFromKind(FieldKindEnum.SHORT_TEXT)]
      break
  }

  return field
}
