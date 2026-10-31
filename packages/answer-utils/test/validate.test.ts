import { FieldKindEnum, NumberPrice } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { fieldsToValidateRules, validate } from '../src'

test('short text', () => {
  const field = {
    validations: {
      required: true
    },
    id: 'SHORT_TEXT',
    title: 'SHORT_TEXT',
    kind: FieldKindEnum.SHORT_TEXT
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], undefined)
  }).toThrowError()
  expect(() => {
    validate(rules[0], '')
  }).toThrowError()
  expect(validate(rules[0], 'hello world')).toBe(undefined)
})

test('number', () => {
  const field = {
    validations: {
      required: true
    },
    id: 'NUMBER',
    title: 'NUMBER',
    kind: FieldKindEnum.NUMBER
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], undefined)
  }).toThrowError()
  expect(() => {
    validate(rules[0], 'hello')
  }).toThrowError()
  expect(validate(rules[0], 1)).toBe(undefined)
})

test('yes or no', () => {
  const field = {
    validations: {
      required: true
    },
    properties: {
      choices: [
        {
          id: 'adUm2Hhr1OOW',
          label: 'Yes'
        },
        {
          id: 'QMR1nZV0u84M',
          label: 'No'
        }
      ]
    },
    id: 'YES_NO',
    title: 'YES_NO',
    kind: FieldKindEnum.YES_NO
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], undefined)
  }).toThrowError()
  expect(() => {
    validate(rules[0], 'hello')
  }).toThrowError()
  expect(validate(rules[0], 'adUm2Hhr1OOW')).toBe(undefined)
  expect(validate(rules[0], 'QMR1nZV0u84M')).toBe(undefined)
})

test('dropdown', () => {
  const field = {
    validations: {
      required: true
    },
    properties: {
      choices: [
        {
          id: 'adUm2Hhr1OOW',
          label: 'Yes'
        },
        {
          id: 'QMR1nZV0u84M',
          label: 'No'
        }
      ]
    },
    id: 'DROPDOWN',
    title: 'DROPDOWN',
    kind: FieldKindEnum.MULTIPLE_CHOICE
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], undefined)
  }).toThrowError()
  expect(() => {
    validate(rules[0], 'hello')
  }).toThrowError()
  expect(validate(rules[0], { value: ['adUm2Hhr1OOW'] })).toBe(undefined)
  expect(validate(rules[0], { value: ['QMR1nZV0u84M'] })).toBe(undefined)
})

test('multiple choice', () => {
  const field = {
    validations: {
      required: true
    },
    properties: {
      allowMultiple: false,
      choices: [
        {
          id: 'adUm2Hhr1OOW',
          label: 'Yes'
        },
        {
          id: 'QMR1nZV0u84M',
          label: 'No'
        }
      ]
    },
    id: 'MULTIPLE_CHOICE',
    title: 'MULTIPLE_CHOICE',
    kind: FieldKindEnum.MULTIPLE_CHOICE
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], undefined)
  }).toThrowError()
  expect(() => {
    validate(rules[0], 'hello')
  }).toThrowError()
  expect(() => {
    validate(rules[0], { value: ['hello'] })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { other: 'hello' })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { value: ['adUm2Hhr1OOW', 'QMR1nZV0u84M'] })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { value: ['hello', 'world'] })
  }).toThrowError()
  expect(validate(rules[0], { value: ['adUm2Hhr1OOW'] })).toBe(undefined)
  expect(validate(rules[0], { value: ['QMR1nZV0u84M'] })).toBe(undefined)
})

test('multiple choice', () => {
  const field = {
    validations: {
      required: true,
      min: 2,
      max: 3
    },
    properties: {
      allowMultiple: true,
      choices: [
        {
          id: 'm2Hhr1OadUOW',
          label: 'Yes'
        },
        {
          id: 'u84MQMR1nZV0',
          label: 'No'
        },
        {
          id: 'adUm2Hhr1OOW',
          label: 'Yes'
        },
        {
          id: 'QMR1nZV0u84M',
          label: 'No'
        }
      ]
    },
    id: 'MULTIPLE_CHOICE',
    title: 'MULTIPLE_CHOICE',
    kind: FieldKindEnum.MULTIPLE_CHOICE
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], { value: ['u84MQMR1nZV0'] })
  }).toThrowError()
  expect(() => {
    validate(rules[0], {
      value: ['m2Hhr1OadUOW', 'u84MQMR1nZV0', 'adUm2Hhr1OOW', 'QMR1nZV0u84M']
    })
  }).toThrowError()
  expect(validate(rules[0], { value: ['m2Hhr1OadUOW', 'u84MQMR1nZV0'] })).toBe(undefined)
  expect(
    validate(rules[0], {
      value: ['m2Hhr1OadUOW', 'u84MQMR1nZV0', 'adUm2Hhr1OOW']
    })
  ).toBe(undefined)
})

test('single choice', () => {
  const field = {
    validations: {
      required: true
    },
    properties: {
      allowMultiple: false,
      choices: [
        {
          id: 'm2Hhr1OadUOW',
          label: 'Yes'
        },
        {
          id: 'u84MQMR1nZV0',
          label: 'No'
        },
        {
          id: 'adUm2Hhr1OOW',
          label: 'Yes'
        },
        {
          id: 'QMR1nZV0u84M',
          label: 'No'
        }
      ]
    },
    id: 'MULTIPLE_CHOICE',
    title: 'MULTIPLE_CHOICE',
    kind: FieldKindEnum.MULTIPLE_CHOICE
  }
  const rules = fieldsToValidateRules([field])

  expect(() => {
    validate(rules[0], { value: ['hello'] })
  }).toThrowError()
  expect(() => {
    validate(rules[0], {
      value: ['m2Hhr1OadUOW', 'u84MQMR1nZV0']
    })
  }).toThrowError()
  expect(
    validate(rules[0], {
      value: ['m2Hhr1OadUOW']
    })
  ).toBe(undefined)
})

test('payment', () => {
  const field = {
    validations: {
      required: false
    },
    properties: {
      concurrency: 'USD',
      price: {
        type: 'number',
        value: 1
      } as NumberPrice
    },
    id: 'PAYMENT',
    title: 'PAYMENT',
    kind: FieldKindEnum.PAYMENT
  }
  const rules = fieldsToValidateRules([field])

  // Server side
  expect(() => {
    validate(rules[0], {})
  }).toThrowError()
  expect(() => {
    validate(rules[0], { amount: -1 })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { amount: 0 })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { amount: -1, currency: 'USD' })
  }).toThrowError()
  expect(validate(rules[0], { amount: 0, currency: 'USD' })).toBe(undefined)

  // Client side
  // @ts-ignore
  process.env.VALIDATE_CLIENT_SIDE = true

  expect(() => {
    validate(rules[0], {})
  }).toThrowError()
  expect(() => {
    validate(rules[0], { name: 'Joe' })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { name: 'Joe', cardNumber: true })
  }).toThrowError()
  expect(() => {
    validate(rules[0], { name: 'Joe', cardNumber: true, cardExpiry: true })
  }).toThrowError()
  expect(
    validate(rules[0], { name: 'Joe', cardNumber: true, cardExpiry: true, cardCvc: true })
  ).toBe(undefined)
  expect(validate(rules[0], undefined)).toBe(undefined)
})

test('file upload requires a usable http(s) upload reference', () => {
  const rule = fieldsToValidateRules([
    {
      id: 'FILE_UPLOAD',
      kind: FieldKindEnum.FILE_UPLOAD,
      title: 'Attachment',
      validations: { required: false }
    }
  ])[0]

  expect(() => validate(rule, {})).toThrowError()
  expect(() => validate(rule, { filename: 'report.pdf' })).toThrowError()
  expect(() =>
    validate(rule, { filename: 'report.pdf', url: 'javascript:alert(document.domain)' })
  ).toThrowError()
  expect(
    validate(rule, {
      filename: 'report.pdf',
      url: 'https://forms.example.com/static/upload/file-id'
    })
  ).toBe(undefined)
  expect(
    validate(rule, {
      filename: 'legacy.pdf',
      urlPrefix: 'https://uploads.example.com/files',
      key: 'file-id'
    })
  ).toBe(undefined)
})

test('file upload accepts a chosen file that submit has not uploaded yet', () => {
  const [optionalRule, requiredRule] = fieldsToValidateRules([
    {
      id: 'OPTIONAL_FILE_UPLOAD',
      kind: FieldKindEnum.FILE_UPLOAD,
      title: 'CV',
      validations: { required: false }
    },
    {
      id: 'REQUIRED_FILE_UPLOAD',
      kind: FieldKindEnum.FILE_UPLOAD,
      title: 'CV',
      validations: { required: true }
    }
  ])
  const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' })
  const fileShape = { name: 'cv.pdf', size: 2, type: 'application/pdf' }

  expect(validate(optionalRule, file)).toBe(undefined)
  expect(validate(requiredRule, file)).toBe(undefined)
  // Matched by tag, as the renderer's isFile does, not by instanceof.
  expect(validate(requiredRule, { ...fileShape, [Symbol.toStringTag]: 'File' })).toBe(undefined)
  expect(() => validate(optionalRule, fileShape)).toThrowError()
})

test('legal terms rejects non-boolean and requires acceptance', () => {
  const requiredRule = fieldsToValidateRules([
    {
      id: 'LEGAL_TERMS',
      kind: FieldKindEnum.LEGAL_TERMS,
      title: 'Terms',
      validations: { required: true }
    }
  ])[0]

  expect(() => validate(requiredRule, 'true')).toThrowError()
  expect(() => validate(requiredRule, false)).toThrowError()
  expect(validate(requiredRule, true)).toBe(undefined)
})

test('input table rejects values that can crash exporters', () => {
  const rule = fieldsToValidateRules([
    {
      id: 'INPUT_TABLE',
      kind: FieldKindEnum.INPUT_TABLE,
      title: 'Table',
      validations: { required: false }
    }
  ])[0]

  expect(() => validate(rule, 'not an array')).toThrowError()
  expect(() => validate(rule, ['not an object'])).toThrowError()
  expect(validate(rule, [{ column_1: 'value' }])).toBe(undefined)
})

test('signature rejects arbitrary non-image values', () => {
  const rule = fieldsToValidateRules([
    {
      id: 'SIGNATURE',
      kind: FieldKindEnum.SIGNATURE,
      title: 'Signature',
      validations: { required: true }
    }
  ])[0]

  expect(() => validate(rule, { url: 'https://example.com/signature.png' })).toThrowError()
  expect(() => validate(rule, 'javascript:alert(1)')).toThrowError()
  expect(validate(rule, 'https://cdn.example.com/signature.png')).toBe(undefined)
})
