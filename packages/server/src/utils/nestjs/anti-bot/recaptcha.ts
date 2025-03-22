import { request } from '../social-login/utils'

interface RecaptchaOptions {
  secret: string
}

export async function verifyRecaptcha(
  token: string,
  options: RecaptchaOptions
): Promise<any> {
  const result = await request({
    method: 'POST',
    url: 'https://www.google.com/recaptcha/api/siteverify',
    data: {
      secret: options.secret,
      response: token
    }
  })
  return result.data?.success
}

export default {
  verifyRecaptcha
}
