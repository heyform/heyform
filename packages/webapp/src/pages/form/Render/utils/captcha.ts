import { pickObject } from '@heyform-inc/utils'

import { GEETEST_CAPTCHA_ID, GOOGLE_RECAPTCHA_KEY } from '@/consts'

export function initGeeTest(): Promise<any> {
  return new Promise(resolve => {
    ;(window as any).initGeetest(
      {
        captchaId: GEETEST_CAPTCHA_ID,
        product: 'bind',
        mask: {
          outside: false,
          bgColor: '#00000000'
        },
        hideBar: ['close']
      },
      (instance: any) => {
        instance.onReady(() => {
          resolve(instance)
        })
      }
    )
  })
}

export function recaptchaToken(instance: any): Promise<string> {
  return new Promise((resolve, reject) => {
    instance.ready(() => {
      instance
        .execute(GOOGLE_RECAPTCHA_KEY, {
          action: 'submit'
        })
        .then(resolve)
        .catch(reject)
    })
  })
}

export function geeTestToken(instance: any): Promise<any> {
  return new Promise((resolve, reject) => {
    instance.onSuccess(() => {
      const values = instance.getValidate()
      const data = pickObject(values, [
        ['lot_number', 'lotNumber'],
        ['captcha_output', 'captchaOutput'],
        ['pass_token', 'passToken'],
        ['gen_time', 'genTime']
      ])

      instance.reset()
      resolve(data)
    })

    instance.onClose((err: any) => {
      reject(err)
    })

    instance.onError((err: any) => {
      console.error(err)
      reject(new Error(err.msg))
    })
  })
}
