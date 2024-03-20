import { CaptchaKindEnum, FieldKindEnum, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { useEffect, useRef, useState } from 'react'

import { Async } from '@/components'
import { Renderer } from '@/components/formComponents'
import { IStripe } from '@/components/formComponents/store'
import { IFormModel } from '@/components/formComponents/typings'
import { FormService } from '@/service'
import { useParam } from '@/utils'

import { CustomCode } from './CustomCode'
import { PasswordCheck } from './PasswordCheck'
import { geeTestToken, initGeeTest, recaptchaToken } from './utils/captcha'
import { Uploader } from './utils/uploader'

let captchaRef: any = null

const Render = () => {
  const { formId } = useParam()

  const openTokenRef = useRef<string>()
  const passwordTokenRef = useRef<string>()

  const [form, setForm] = useState<FormModel | null>(null)
  const [isPasswordChecked, setIsPasswordChecked] = useState(false)

  async function fetchData() {
    const result = await FormService.publicForm(formId)

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

      const { clientSecret } = await FormService.completeSubmission({
        formId,
        answers: {
          ...values,
          ...file
        },
        openToken: openTokenRef.current,
        passwordToken: passwordTokenRef.current,
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
        captchaRef = window.grecaptcha
        break
    }
  }

  useEffect(() => {
    openForm()
    initCaptcha()
  }, [])

  if (form?.settings?.requirePassword && !isPasswordChecked) {
    return <PasswordCheck form={form} onFinish={handlePasswordFinish} />
  }

  return (
    <Async className="heyform-render-root" request={fetchData} errorRender={err => err.message}>
      {form && (
        <>
          <Renderer
            form={form as IFormModel}
            stripeApiKey={(form as any).stripe?.publishableKey}
            stripeAccountId={(form as any).stripe?.accountId}
            autoSave={!(form.settings?.enableTimeLimit && helper.isValid(form.settings?.timeLimit))}
            alwaysShowNextButton={true}
            customUrlRedirects={(form.settings as IMapType)?.customUrlRedirects}
            onSubmit={handleSubmit}
          />
          <CustomCode form={form} />
        </>
      )}
    </Async>
  )
}

export default Render
