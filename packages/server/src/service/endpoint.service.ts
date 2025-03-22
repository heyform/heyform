import {
  AKISMET_KEY,
  APP_HOMEPAGE,
  ENCRYPTION_KEY,
  GOOGLE_RECAPTCHA_SECRET
} from '@environments'
import { aesDecryptObject, akismet, recaptcha } from '@heyforms/nestjs'
import { CaptchaKindEnum, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { BadRequestException, Injectable } from '@nestjs/common'
import { Logger } from '@utils'
import { AuthService } from './auth.service'

interface VerifySpamOptions {
  answers: any[]
  ip?: string
  userAgent?: string
}

@Injectable()
export class EndpointService {
  private readonly logger!: Logger

  constructor(private readonly authService: AuthService) {
    this.logger = new Logger('EndpointService')
  }

  decryptToken(token: string): Record<string, any> {
    let obj: Record<string, any>

    try {
      obj = aesDecryptObject(token, ENCRYPTION_KEY)
    } catch (err) {
      this.logger.error(err)
    }

    if (helper.isEmpty(obj)) {
      throw new BadRequestException('Invalid form token')
    }

    return obj
  }

  async antiBotCheck(captchaKind: CaptchaKindEnum, input: any): Promise<void> {
    let result: any

    switch (captchaKind) {
      case CaptchaKindEnum.GOOGLE_RECAPTCHA:
        result = await this.verifyRecaptcha(input.recaptchaToken)
        break

      case CaptchaKindEnum.GEETEST_CAPTCHA:
        result = await this.authService.gt4Validate({
          lotNumber: input.lotNumber,
          captchaOutput: input.captchaOutput,
          passToken: input.passToken,
          genTime: input.genTime
        })
        break
    }

    if (helper.isEmpty(result)) {
      throw new BadRequestException('Failed to pass the bot-detection check')
    }
  }

  public async verifySpam({
    answers,
    ip,
    userAgent
  }: VerifySpamOptions): Promise<boolean> {
    // Only verify input fields
    const fields = answers.filter(
      answer =>
        answer.kind === FieldKindEnum.SHORT_TEXT ||
        answer.kind === FieldKindEnum.LONG_TEXT
    )

    if (fields.length < 1) {
      return false
    }

    return await akismet.verifySpam(
      fields.map(field => field.value).join('\n'),
      {
        key: AKISMET_KEY,
        url: APP_HOMEPAGE,
        ip,
        userAgent
      }
    )
  }

  async verifyRecaptcha(token: string): Promise<any> {
    return recaptcha.verifyRecaptcha(token, {
      secret: GOOGLE_RECAPTCHA_SECRET
    })
  }
}
