import { test, expect } from 'vitest'
import { fieldsToValidateRules, validate } from '../src'
import { FieldKindEnum, NumberPrice } from '@heyform-inc/shared-types-enums'

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
