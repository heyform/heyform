import { fieldsToValidateRules, FieldsToValidateRules } from './fields-to-validate-rules'
import { isDate, isMobilePhone } from './helper'
import { AnswerValue, FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import dayjs from 'dayjs'

export interface ValidateErrorResponse {
  id: string
  kind: string
  title?: string
  message: string
  value?: any
}

export class ValidateError extends Error {
  response: ValidateErrorResponse

  constructor(response: ValidateErrorResponse) {
    super()
    this.message = response.message
    this.response = response
  }
}

export function validate(rule: FieldsToValidateRules, value: AnswerValue): void {
  if (!rule.required) {
    if (helper.isNil(value)) {
      return
    }
  } else {
    if (helper.isEmpty(value)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'This field is required'
      })
    }
  }

  switch (rule.kind) {
    case FieldKindEnum.SHORT_TEXT:
    case FieldKindEnum.LONG_TEXT:
    case FieldKindEnum.COUNTRY:
      validateText(rule, value)
      break

    case FieldKindEnum.NUMBER:
      validateNumber(rule, value)
      break

    case FieldKindEnum.PHONE_NUMBER:
      validatePhoneNumber(rule, value)
      break

    case FieldKindEnum.EMAIL:
      validateEmail(rule, value)
      break

    case FieldKindEnum.URL:
      validateUrl(rule, value)
      break

    case FieldKindEnum.YES_NO:
      validateSingleChoice(rule, value)
      break

    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      validateMultipleChoice(rule, value)
      break

    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      validateRating(rule, value)
      break

    case FieldKindEnum.DATE:
      validateDate(rule, value)
      break

    case FieldKindEnum.DATE_RANGE:
      validateDateRange(rule, value)
      break

    case FieldKindEnum.FILE_UPLOAD:
      validateFile(rule, value)
      break

    case FieldKindEnum.PAYMENT:
      validatePayment(rule, value)
      break

    case FieldKindEnum.FULL_NAME:
      validateFullName(rule, value)
      break

    case FieldKindEnum.ADDRESS:
      validateAddress(rule, value)
      break

    case FieldKindEnum.LEGAL_TERMS:
      validateLegalTerms(rule, value)
      break

    case FieldKindEnum.INPUT_TABLE:
      validateInputTable(rule, value)
      break

    case FieldKindEnum.SIGNATURE:
      validateSignature(rule, value)
      break
  }
}

export function validateFields(fields: FormField[], values: Record<string, AnswerValue>) {
  const rules = fieldsToValidateRules(fields)

  for (const rule of rules) {
    validate(rule, values[rule.id])
  }
}

export function validateRequiredField(field: FormField, values: any): boolean {
  const _field = {
    ...{},
    ...field,
    validations: {
      ...field.validations,
      required: true
    }
  }

  try {
    validateFields([_field], values)
    return true
  } catch (err) {
    return false
  }
}

function validateText(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isString(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  if (!validateLength(value, rule.min, rule.max)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: `The text length must be between ${rule.min} to ${rule.max}`
    })
  }
}

function validateNumber(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isNumeric(String(value))) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: `This field should be a number`
    })
  }

  if (!validateInt(value, rule.min, rule.max)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: `The number must be between ${rule.min} to ${rule.max}`
    })
  }
}

function validatePhoneNumber(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!isMobilePhone(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter a valid mobile phone number'
    })
  }
}

function validateEmail(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isString(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  if (!helper.isEmail(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter a valid email address'
    })
  }
}

function validateUrl(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isString(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  if (!helper.isURL(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter a valid url'
    })
  }
}

function validateSingleChoice(rule: FieldsToValidateRules, value: AnswerValue) {
  if (helper.isEmpty(rule.choices)) {
    return
  }

  if (!rule.choices!.includes(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please choose you choice'
    })
  }
}

function validateMultipleChoice(rule: FieldsToValidateRules, value: AnswerValue) {
  if (helper.isEmpty(rule.choices)) {
    return
  }

  if (!helper.isValidArray(value.value)) {
    if (!helper.isObject(value)) {
      value = {}
    }

    value.value = []
  }

  if (value.value.length < 1 && helper.isEmpty(value?.other)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  let isOtherExists = false

  if (!rule.allowOther) {
    if (helper.isValid(value?.other)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Other value is not allowed'
      })
    }
  } else {
    if (!(helper.isNil(value?.other) || (isOtherExists = helper.isValid(value?.other)))) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Other value should not be empty'
      })
    }
  }

  const count = value.value.length + (isOtherExists ? 1 : 0)

  if (!rule.allowMultiple) {
    if (count > 1) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Multiple choose is not allowed'
      })
    }

    const result = isOtherExists ? value.value.length === 0 : rule.choices!.includes(value.value[0])

    if (!result) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Cannot select non-specified choices'
      })
    }
  }

  const result =
    validateInt(count, rule.min, rule.max) &&
    value.value.filter((row: string) => !rule.choices!.includes(row)).length < 1

  if (!result) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Cannot select non-specified choices'
    })
  }
}

function validateRating(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!validateInt(value, 1, rule.total!)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Rating value must be number'
    })
  }
}

function validateDate(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isString(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  if (!isDate(value, rule.format!)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter a valid date'
    })
  }
}

function validateDateRange(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isObject(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }

  if (!isDate(value.start, rule.format!)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: "Start date isn't valid"
    })
  }

  if (!isDate(value.end, rule.format!)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: "End date isn't valid"
    })
  }

  const start = dayjs(value.start, rule.format!)
  const end = dayjs(value.end, rule.format!)

  if (end.isBefore(start)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'End date must be after start date'
    })
  }
}

function validateFile(rule: FieldsToValidateRules, value: AnswerValue) {
  if (!helper.isValid(value) && helper.isObject(value)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'This field is required'
    })
  }
}

function validateFullName(rule: FieldsToValidateRules, value: AnswerValue) {
  if (helper.isEmpty(value.firstName)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter first name'
    })
  }

  if (helper.isEmpty(value.lastName)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter last name'
    })
  }
}

function validateAddress(rule: FieldsToValidateRules, value: AnswerValue) {
  if (helper.isEmpty(value.address1)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter address1'
    })
  }

  if (helper.isEmpty(value.city)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter city'
    })
  }

  if (helper.isEmpty(value.state)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter state'
    })
  }

  if (helper.isEmpty(value.zip)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please enter zip'
    })
  }

  if (helper.isEmpty(value.country)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Please select country'
    })
  }
}

function validatePayment(rule: FieldsToValidateRules, value: AnswerValue) {
  if (helper.isValid(process.env.VALIDATE_CLIENT_SIDE)) {
    if (!helper.isValid(value.name)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Name on card is incomplete'
      })
    }

    if (!helper.isTrue(value.cardNumber)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Card number is incomplete'
      })
    }

    if (!helper.isTrue(value.cardExpiry)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Expiry date is incomplete'
      })
    }

    if (!helper.isTrue(value.cardCvc)) {
      throw new ValidateError({
        id: rule.id,
        kind: rule.kind,
        title: rule.title,
        message: 'Card cvc is incomplete'
      })
    }

    return
  }

  if (helper.isEmpty(value.amount) || value.amount < 0) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Invalid payment amount'
    })
  }

  if (helper.isEmpty(value.currency)) {
    throw new ValidateError({
      id: rule.id,
      kind: rule.kind,
      title: rule.title,
      message: 'Invalid payment currency'
    })
  }
}

function validateInt(value: any, min?: number, max?: number): boolean {
  const int = parseInt(value)
  return (max ? int <= max : true) && int >= (min || 0)
}

function validateLength(value: AnswerValue, min?: number, max?: number): boolean {
  return (max ? value.length <= max : true) && value.length >= (min || 0)
}

function validateLegalTerms(rule: FieldsToValidateRules, value: AnswerValue): boolean {
  return (rule.required && helper.isTrue(value)) || false
}

function validateInputTable(rule: FieldsToValidateRules, value: AnswerValue): boolean {
  return (rule.required && helper.isValidArray(value)) || false
}

function validateSignature(rule: FieldsToValidateRules, value: AnswerValue): boolean {
  return (
    (rule.required && helper.isValid(value) && value.startsWith('data:image/png;base64,')) || false
  )
}
