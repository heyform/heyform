import { FieldKindEnum, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export function isStripeEnabled(form: any): boolean {
  return helper.isValid(form.stripe?.accountId) && !!getPaymentField(form)
}

export function getPaymentField(form: FormModel) {
  return form.fields?.find(f => f.kind === FieldKindEnum.PAYMENT)
}
