// @ts-ignore
import { AkismetClient } from 'akismet-api'

interface VerifySpamOptions {
  key: string
  url: string
  ip?: string
  userAgent?: string
}

export async function verifySpam(content: string, options: VerifySpamOptions): Promise<boolean> {
  const client = new AkismetClient({
    key: options.key,
    blog: options.url
  })

  return await client.checkSpam({
    type: 'contact-form',
    ip: options.ip,
    useragent: options.userAgent,
    content
  })
}

export default {
  verifySpam
}
