// @ts-ignore
import * as Geetest from 'gt3-sdk'

interface GeetestOptions {
  key: string
  secret: string
}

interface GeetestRequest {
  challenge: string
  validate: string
  seccode: string
}

export async function initGeetest(options: GeetestOptions): Promise<any> {
  const gt = new Geetest({
    geetest_id: options.key,
    geetest_key: options.secret
  })
  return await gt.register()
}

export async function verifyGeetest(
  request: GeetestRequest,
  options: GeetestOptions
): Promise<any> {
  const gt = new Geetest({
    geetest_id: options.key,
    geetest_key: options.secret
  })

  return await gt.validate(false, {
    geetest_challenge: request.challenge,
    geetest_validate: request.validate,
    geetest_seccode: request.seccode
  })
}

export default {
  initGeetest,
  verifyGeetest
}
