import { CURRENCY_SYMBOLS } from './consts'
import { Answer, FullNameValue, ServerSidePaymentValue } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import Big from 'big.js'

function fileUpload(answer: Answer, livePreview = false) {
  if (livePreview) {
    return {
      filename: (answer as any).name
    }
  }

  if (helper.isURL(answer.value)) {
    return {
      filename: '',
      url: answer.value
    }
  }

  return {
    filename: answer.value.filename || '',
    url: answer.value.url
  }
}

function rating(answer: Answer): string {
  return answer.value
}

function singleChoice(answer: Answer): string {
  const choice = answer.properties!.choices?.find(row => row.id === answer.value)
  return choice ? choice.label : ''
}

function multipleChoice(answer: Answer): string {
  return (answer.properties?.choices?.filter(row => answer.value?.value.includes(row.id)) || [])
    .map(row => row.label)
    .concat([answer.value?.other])
    .filter(row => helper.isValid(row))
    .join(', ')
}

function fullName(answer: Answer): FullNameValue {
  return answer.value
}

function address(answer: Answer): string {
  return [
    answer.value.address1,
    ',',
    answer.value.address2,
    answer.value.city,
    ',',
    answer.value.state,
    ',',
    answer.value.country,
    answer.value.zip
  ]
    .filter(Boolean)
    .join(' ')
}

function legalTerms(answer: Answer): string {
  return helper.isTrue(answer.value) ? 'Yes' : 'No'
}

function dateRange(answer: Answer): string {
  return [answer.value.start, answer.value.end].filter(Boolean).join(' - ')
}

function inputTable(answer: Answer): string {
  const columns = answer.properties?.tableColumns

  if (helper.isValidArray(columns)) {
    const result: string[] = []

    answer.value.forEach((values: Record<string, string>) => {
      if (helper.isValid(values)) {
        const row = columns!.map(column => values[column.id]).join(', ')
        result.push(row)
      }
    })

    return result.join('\n')
  }

  return ''
}

function payment(answer: Answer): string {
  const value = answer.value as ServerSidePaymentValue
  const price = Big(value.amount).div(100).toFixed(2)
  let result = CURRENCY_SYMBOLS[value.currency] + price

  if (helper.isValid(value.paymentIntentId)) {
    result = `Succeeded ${result}`
  } else {
    result = `Incomplete ${result}`
  }

  return result
}

export default {
  fileUpload,
  rating,
  singleChoice,
  multipleChoice,
  fullName,
  address,
  legalTerms,
  dateRange,
  inputTable,
  payment
}
