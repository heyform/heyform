import { CaptchaKindEnum, FieldKindEnum, FormSettings } from '@heyform-inc/shared-types-enums'
import { BadRequestException, Injectable } from '@nestjs/common'

import {
  AKISMET_KEY,
  APP_HOMEPAGE_URL,
  FORM_ENCRYPTION_KEY,
  GOOGLE_RECAPTCHA_SECRET
} from '@environments'
import { helper } from '@heyform-inc/utils'
import {
  aesDecryptObject,
  akismet,
  assertFormPasswordToken,
  assertOpenToken,
  recaptcha
} from '@utils'
import { Logger } from '@utils'

interface VerifySpamOptions {
  answers: any[]
  ip?: string
  userAgent?: string
}

@Injectable()
export class EndpointService {
  private readonly logger!: Logger

  constructor() {
    this.logger = new Logger('EndpointService')
  }

  decryptToken(token: string): Record<string, any> {
    let obj: Record<string, any>

    try {
      obj = aesDecryptObject(token, FORM_ENCRYPTION_KEY)
    } catch (err) {
      this.logger.error(err)
    }

    if (helper.isEmpty(obj)) {
      throw new BadRequestException('Invalid form token')
    }

    return obj
  }

  assertOpenToken(
    token: Record<string, any>,
    formId: string,
    settings: FormSettings,
    now: number,
    options?: Parameters<typeof assertOpenToken>[4]
  ): number {
    return assertOpenToken(token, formId, settings, now, options)
  }

  assertFormPasswordToken(
    token: Record<string, any>,
    formId: string,
    anonymousId: string,
    passwordHash: string,
    now: number
  ): void {
    assertFormPasswordToken(token, formId, anonymousId, passwordHash, now)
  }

  async antiBotCheck(captchaKind: CaptchaKindEnum, input: any): Promise<void> {
    let result: any

    switch (captchaKind) {
      case CaptchaKindEnum.GOOGLE_RECAPTCHA:
        result = await this.verifyRecaptcha(input.recaptchaToken)
        break
    }

    if (result !== true) {
      throw new BadRequestException('Failed to pass the bot-detection check')
    }
  }

  public async verifySpam({ answers, ip, userAgent }: VerifySpamOptions): Promise<boolean> {
    // Only verify input fields
    const fields = answers.filter(
      answer => answer.kind === FieldKindEnum.SHORT_TEXT || answer.kind === FieldKindEnum.LONG_TEXT
    )

    if (fields.length < 1) {
      return false
    }

    return await akismet.verifySpam(fields.map(field => field.value).join('\n'), {
      key: AKISMET_KEY,
      url: APP_HOMEPAGE_URL,
      ip,
      userAgent
    })
  }

  async verifyRecaptcha(token: string): Promise<any> {
    return recaptcha.verifyRecaptcha(token, {
      secret: GOOGLE_RECAPTCHA_SECRET
    })
  }
}
