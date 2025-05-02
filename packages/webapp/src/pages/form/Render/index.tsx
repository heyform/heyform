import {
  CaptchaKindEnum,
  FieldKindEnum, // FormModel,
  HiddenFieldAnswer
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { useEffect, useRef, useState } from 'react'

import { Async } from '@/components'
import { Renderer } from '@/pages/form/views/FormComponents'
import { IStripe } from '@/pages/form/views/FormComponents/store'
import { IFormModel } from '@/pages/form/views/FormComponents/typings'
import { FormService } from '@/services'
import { useParam, useQuery } from '@/utils'

import { CustomCode } from './CustomCode'
import { PasswordCheck } from './PasswordCheck'
import { geeTestToken, initGeeTest, recaptchaToken } from './utils/captcha'
import { Uploader } from './utils/uploader'

let captchaRef: any = null

const Render = () => {
  const { formId } = useParam()
  const query = useQuery()

  const openTokenRef = useRef<string>(null)
  const passwordTokenRef = useRef<string>(null)

  const [form, setForm] = useState<IFormModel | null>(null)
  const [isPasswordChecked, setIsPasswordChecked] = useState(false)

  async function fetchData() {
    const result = await FormService.publicForm(formId)
    const result2 = await FormService.detail(formId)
    console.log('result2')
    console.log(result2)

    setForm(result)
    return true
  }

  async function openForm() {
    openTokenRef.current = await FormService.openForm(formId)
  }

  function handlePasswordFinish(passwordToken: string) {
    passwordTokenRef.current = passwordToken
    setIsPasswordChecked(true)
  }

  async function handleSubmit(values: any, partialSubmission?: boolean, stripe?: IStripe) {
    try {
      let token: Record<string, any> = {}

      switch (form!.settings?.captchaKind) {
        case CaptchaKindEnum.GOOGLE_RECAPTCHA:
          token.recaptchaToken = await recaptchaToken(captchaRef)
          break

        case CaptchaKindEnum.GEETEST_CAPTCHA:
          captchaRef?.showCaptcha()
          token = await geeTestToken(captchaRef)
          break
      }

      const file = await new Uploader(form!, values).start()

      const hiddenFields = (form!.hiddenFields || [])
        .map(field => {
          const value = query[field.name]

          if (helper.isValid(value)) {
            return {
              ...field,
              value
            }
          }
        })
        .filter(Boolean) as HiddenFieldAnswer[]

      const { clientSecret } = await FormService.completeSubmission({
        formId,
        answers: {
          ...values,
          ...file
        },
        hiddenFields,
        openToken: openTokenRef.current || undefined,
        passwordToken: passwordTokenRef.current || undefined,
        partialSubmission,
        ...(token || {})
      })

      if (stripe && helper.isValid(clientSecret)) {
        const paymentField = form!.fields?.find(f => f.kind === FieldKindEnum.PAYMENT)

        if (paymentField) {
          const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: stripe.elements.getElement('cardNumber'),
              billing_details: values[paymentField.id]?.billingDetails
            }
          })

          if (result.error) {
            throw new Error(result.error.message)
          }
        }
      }
    } catch (err: any) {
      // Reset GeeTest captcha
      captchaRef?.reset()

      /**
       * Throw error to let Renderer knows that there was an error.
       * If we don't do this, the form will be shown as submitted
       */
      throw err
    }
  }

  async function initCaptcha() {
    switch (form?.settings?.captchaKind) {
      case CaptchaKindEnum.GEETEST_CAPTCHA:
        captchaRef = await initGeeTest()
        break

      case CaptchaKindEnum.GOOGLE_RECAPTCHA:
        captchaRef = (window as any).grecaptcha
        break
    }
  }

  useEffect(() => {
    openForm()
    initCaptcha()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (form?.settings?.requirePassword && !isPasswordChecked) {
    return <PasswordCheck form={form} onFinish={handlePasswordFinish} />
  }

  return (
    <Async className="heyform-render-root" fetch={fetchData} errorRender={err => err.message}>
      {form && (
        <>
          <Renderer
            form={form}
            stripeApiKey={(form as any).stripe?.publishableKey}
            stripeAccountId={(form as any).stripe?.accountId}
            autoSave={!(form.settings?.enableTimeLimit && helper.isValid(form.settings?.timeLimit))}
            alwaysShowNextButton={true}
            customUrlRedirects={true}
            onSubmit={handleSubmit}
          />
          <CustomCode form={form} query={query} />
        </>
      )}
    </Async>
  )
}

export default Render
