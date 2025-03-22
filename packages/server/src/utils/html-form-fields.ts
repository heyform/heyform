import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { helper, nanoid } from '@heyform-inc/utils'
import * as cheerio from 'cheerio'
import { Element } from 'cheerio'

export function htmlFormFields(html: string): FormField[] {
  const fields: FormField[] = []

  const $ = cheerio.load(html)
  const $forms = Array.from($('form'))

  if (!helper.isValidArray($forms)) {
    return fields
  }

  for (const row of $forms[0].childNodes) {
    if (row.type === 'tag') {
      const $node = $(row)
      const label = $node.find('label')
      const $elements = Array.from($node.find('input, textarea, select'))

      if ($elements.length > 0) {
        const element = $elements[0]
        const field: any = {
          id: nanoid(12),
          title: label.text(),
          validations: {
            required: true
          }
        }

        const $radios = $elements.filter(
          row => row.name === 'input' && row.attribs.type === 'radio'
        )
        const $checkboxes = $elements.filter(
          row => row.name === 'input' && row.attribs.type === 'checkbox'
        )

        if ($radios.length > 0) {
          parseRadio($radios, field)
        } else if ($checkboxes.length > 0) {
          parseCheckbox($checkboxes, field)
        } else {
          switch (element.name) {
            case 'textarea':
              field.kind = FieldKindEnum.LONG_TEXT
              break

            case 'input':
              parseInput(element, field)
              break

            case 'select':
              parseSelect($, element, field)
              break

            default:
              field.kind = FieldKindEnum.SHORT_TEXT
          }
        }

        fields.push(field)
      }
    }
  }

  return fields
}

function parseSelect(
  $: cheerio.CheerioAPI,
  element: Element,
  field: FormField
) {
  field.kind = FieldKindEnum.MULTIPLE_CHOICE
  field.properties = {
    allowMultiple: false,
    choices: element.children
      .filter(
        (row: any) =>
          row.type === 'tag' &&
          row.name === 'option' &&
          helper.isValid(row.attribs.value)
      )
      .map((row: any) => ({
        id: nanoid(12),
        label: $(row).text()
      }))
  }
}

function parseRadio(elements: Element[], field: FormField) {
  field.kind = FieldKindEnum.MULTIPLE_CHOICE
  field.properties = {
    allowMultiple: false,
    choices: elements.map((row: any) => ({
      id: nanoid(12),
      label: row.attribs.title || ''
    }))
  }
}

function parseCheckbox(elements: Element[], field: FormField) {
  field.kind = FieldKindEnum.MULTIPLE_CHOICE
  field.properties = {
    allowMultiple: false,
    choices: elements.map((row: any) => ({
      id: nanoid(12),
      label: row.attribs.title || ''
    }))
  }
}

function parseInput(element: Element, field: FormField) {
  switch (element.attribs.type) {
    case 'tel':
      field.kind = FieldKindEnum.PHONE_NUMBER
      break

    case 'email':
      field.kind = FieldKindEnum.EMAIL
      break

    case 'number':
      field.kind = FieldKindEnum.NUMBER
      break

    case 'file':
      field.kind = FieldKindEnum.FILE_UPLOAD
      break

    case 'date':
    case 'datetime':
    case 'datetime-local':
      field.kind = FieldKindEnum.DATE
      break

    default:
      field.kind = FieldKindEnum.SHORT_TEXT
  }
}
