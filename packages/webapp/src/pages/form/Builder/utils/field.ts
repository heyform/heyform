import { htmlUtils } from '@heyform-inc/answer-utils'
import {
  ChoiceBadgeEnum,
  FORM_FIELD_KINDS,
  FieldKindEnum,
  Logic,
  Property,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { clone, helper, nanoid } from '@heyform-inc/utils'

import { FormFieldType } from '@/types'

import { getValidLogics } from './logic'

export function serializeFields(rawFields: FormFieldType[]) {
  let questions: Partial<FormFieldType>[] = []
  let index = 1

  const fields = rawFields.map(f => {
    if (helper.isArray(f.title)) {
      f.title = htmlUtils.serialize(f.title)
    }

    if (helper.isArray(f.description)) {
      f.description = htmlUtils.serialize(f.description)
    }

    if (f.kind === FieldKindEnum.GROUP && helper.isNil(f.isCollapsed)) {
      f.isCollapsed = false
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

export function initFields(rawFields?: FormFieldType[], rawLogics?: Logic[]) {
  let list = rawFields?.filter(f => FORM_FIELD_KINDS.includes(f.kind)) || []

  if (list.length > 0) {
    list = list.map((f: any) => {
      f.title = f.title
      delete f.titleSchema

      return f
    })
  }

  const { fields, questions } = serializeFields(list)
  const currentField = fields[0]
  const currentId = currentField?.id
  const logics = getValidLogics(fields, rawLogics)

  return {
    fields,
    questions,
    currentField,
    currentId,
    logics
  }
}

export function getPropertiesFromKind(properties: Property, newKind: FieldKindEnum) {
  const props = properties ? clone(properties) : {}

  switch (newKind) {
    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      if (!helper.isArray(props.choices)) {
        props.badge = ChoiceBadgeEnum.LETTER
        props.choices = [
          {
            id: nanoid(12),
            label: ''
          }
        ]
      }
      break

    case FieldKindEnum.RATING:
      if (!props.total) {
        props.total = 5
      }
      if (!props.shape) {
        props.shape = 'star'
      }
      break

    case FieldKindEnum.OPINION_SCALE:
      if (!props.total) {
        props.total = 10
      }
      break

    case FieldKindEnum.YES_NO:
      if (!helper.isArray(props.choices) || props.choices.length !== 2) {
        props.choices = [
          {
            id: nanoid(12),
            label: 'Yes'
          },
          {
            id: nanoid(12),
            label: 'No'
          }
        ]
      }
      break

    case FieldKindEnum.DATE:
    case FieldKindEnum.DATE_RANGE:
      if (!props.format) {
        props.format = 'MM/DD/YYYY'
      }
      if (!props.allowTime) {
        props.allowTime = false
      }
      break

    case FieldKindEnum.PHONE_NUMBER:
      if (!props.defaultCountryCode) {
        props.defaultCountryCode = 'US'
      }
      break

    case FieldKindEnum.INPUT_TABLE:
      if (!helper.isArray(props.tableColumns)) {
        props.tableColumns = [
          {
            id: nanoid(12),
            label: ''
          },
          {
            id: nanoid(12),
            label: ''
          }
        ]
      }
      break

    case FieldKindEnum.PAYMENT:
      if (!props.currency) {
        props.currency = 'USD'
      }
      if (!props.price) {
        props.price = {
          type: 'number',
          value: 0
        }
      }
      break

    case FieldKindEnum.GROUP:
      if (!helper.isArray(props.fields)) {
        props.fields = [getFieldFromKind(FieldKindEnum.SHORT_TEXT)]
      }
      break
  }

  return props
}

export function getFieldFromKind(kind: FieldKindEnum | string): FormFieldType {
  const field: FormFieldType = {
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
      field.properties!.verticalAlignment = true
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
      field.isCollapsed = false
      field.properties!.fields = [getFieldFromKind(FieldKindEnum.SHORT_TEXT)]
      break
  }

  return field
}

export function getFilteredFields(fields?: FormFieldType[]) {
  const result = {
    fields: [] as FormFieldType[]
  }

  if (helper.isValidArray(fields)) {
    for (const row of fields!) {
      const field: FormFieldType = {
        id: row.id,
        kind: row.kind,
        title: htmlUtils.parse(row.title! as string),
        description: htmlUtils.parse(row.description! as string),
        validations: row.validations,
        properties: row.properties,
        layout: row.layout
      }

      if (row.kind === FieldKindEnum.GROUP) {
        field.properties = {
          ...field.properties,
          ...getFilteredFields(row.properties?.fields)
        }
      }

      result.fields.push(field)
    }
  }

  return result
}
