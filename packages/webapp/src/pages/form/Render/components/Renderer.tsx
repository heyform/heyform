import {
  FormRenderer,
  getTheme,
  getThemeStyle,
  getWebFontURL,
  sendMessageToParent
} from '@heyform-inc/form-renderer/src'
import {
  CaptchaKindEnum,
  FieldKindEnum,
  FormModel,
  HiddenFieldAnswer
} from '@heyform-inc/shared-types-enums'
import { FC, useEffect, useRef, useState } from 'react'

import { EndpointService } from '../service/endpoint'
import { recaptchaToken } from '../utils/captcha'
import { isStripeEnabled } from '../utils/payment'
import { Uploader } from '../utils/uploader'
import { helper } from '@heyform-inc/utils'

import { GOOGLE_RECAPTCHA_KEY } from '@/consts/env'

import { PasswordCheck } from './PasswordCheck'

interface RendererProps {
  form: FormModel
  query: Record<string, Any>
  locale: string
  contactId?: string
}

let captchaRef: Any = null

export const Renderer: FC<RendererProps> = ({ form, query, locale, contactId }) => {
  const openTokenRef = useRef<string>('')
  const passwordTokenRef = useRef<string>('')
  const [isPasswordChecked, setIsPasswordChecked] = useState(false)

  function loadExternalScript(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadedScript = document.getElementById(id) as HTMLScriptElement | null

      if (loadedScript) {
        if (loadedScript.dataset.loaded === 'true') {
          resolve()
          return
        }

        loadedScript.addEventListener('load', () => resolve(), { once: true })
        loadedScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
          once: true
        })
        return
      }

      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = true
      script.defer = true
      script.addEventListener(
        'load',
        () => {
          script.dataset.loaded = 'true'
          resolve()
        },
        { once: true }
      )
      script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true
      })
      document.body.appendChild(script)
    })
  }

  async function ensureCaptchaReady() {
    if (form.settings?.captchaKind !== CaptchaKindEnum.GOOGLE_RECAPTCHA) {
      return
    }

    if (
      captchaRef?.ready &&
      (typeof captchaRef?.execute === 'function' ||
        typeof captchaRef?.enterprise?.execute === 'function')
    ) {
      return
    }

    const key =
      window.heyform?.googleRecaptchaKey ||
      (form.settings as Any)?.googleRecaptchaKey ||
      GOOGLE_RECAPTCHA_KEY

    if (!key) {
      throw new Error('Google reCAPTCHA key is not configured')
    }

    window.heyform = window.heyform || {}
    window.heyform.googleRecaptchaKey = key

    await loadExternalScript(
      'google-recaptcha-sdk',
      `https://www.google.com/recaptcha/api.js?render=${key}`
    )
    captchaRef = window.grecaptcha

    // Some keys only work with enterprise.js. Fallback automatically.
    if (
      !captchaRef?.ready ||
      (typeof captchaRef?.execute !== 'function' &&
        typeof captchaRef?.enterprise?.execute !== 'function')
    ) {
      await loadExternalScript(
        'google-recaptcha-enterprise-sdk',
        `https://www.google.com/recaptcha/enterprise.js?render=${key}`
      )
      captchaRef = window.grecaptcha
    }

    if (!captchaRef?.ready) {
      throw new Error('Google reCAPTCHA failed to initialize')
    }
  }

  async function openForm() {
    sendMessageToParent('FORM_OPENED')
    openTokenRef.current = await EndpointService.openForm(form.id)
  }

  function handlePasswordFinish(passwordToken: string) {
    passwordTokenRef.current = passwordToken
    setIsPasswordChecked(true)
  }

  async function handleSubmit(values: Any, partialSubmission?: boolean, stripe?: Any) {
    try {
      let token: Record<string, Any> = {}

      if (form.settings?.captchaKind === CaptchaKindEnum.GOOGLE_RECAPTCHA) {
        await ensureCaptchaReady()
        token.recaptchaToken = await recaptchaToken(captchaRef)
      }

      const file = await new Uploader(form, values, openTokenRef.current).start()

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

      const { clientSecret, pseudonymId } = await EndpointService.completeSubmission({
        formId: form.id,
        contactId,
        answers: {
          ...values,
          ...file
        },
        hiddenFields,
        openToken: openTokenRef.current,
        passwordToken: passwordTokenRef.current,
        partialSubmission,
        ...(token || {})
      })

      if (stripe && helper.isValid(clientSecret)) {
        const paymentField = form.fields?.find(f => f.kind === FieldKindEnum.PAYMENT)

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

      sendMessageToParent('FORM_SUBMITTED')

      return { pseudonymId }
    } catch (err: Any) {
      /**
       * Throw error to let Renderer knows that there was an error.
       * If we don't do this, the form will be show as submitted
       */
      throw err
    }
  }

  async function initCaptcha() {
    // reCAPTCHA initializes lazily on submit.
  }

  useEffect(() => {
    sendMessageToParent('FORM_LOADED')

    if (!form.suspended && form.settings?.active) {
      openForm()
      initCaptcha().catch(console.error)
    }
  }, [])

  if (form.settings?.requirePassword && !isPasswordChecked) {
    return <PasswordCheck form={form} onFinish={handlePasswordFinish} />
  }

  const theme = getTheme(form.themeSettings?.theme)
  const fontURL = getWebFontURL(theme.fontFamily)

  return (
    <>
      {helper.isValid(fontURL) && <link href={fontURL} rel="stylesheet" />}
      <style>{getThemeStyle(theme, query)}</style>

      {isStripeEnabled(form) && <script id="stripe" src="https://js.stripe.com/v3/" />}

      <FormRenderer
        form={form as Any}
        query={query}
        locale={locale}
        stripeApiKey={(form as Any).stripe?.publishableKey}
        stripeAccountId={(form as Any).stripe?.accountId}
        autoSave={false}
        alwaysShowNextButton={true}
        customUrlRedirects={(form.settings as Any)?.customUrlRedirects}
        enableQuestionList={form.settings?.enableQuestionList}
        enableNavigationArrows={form.settings?.enableNavigationArrows}
        onSubmit={handleSubmit}
      />

      {/* Custom css */}
      {helper.isValid(form.themeSettings?.theme?.customCSS) && (
        <style>{form.themeSettings!.theme!.customCSS!}</style>
      )}
    </>
  )
}
