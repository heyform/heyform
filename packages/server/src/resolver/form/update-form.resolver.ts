import { Auth, Form, FormGuard, User } from '@decorator'
import { BCRYPT_SALT } from '@environments'
import { UpdateFormInput } from '@graphql'
import { helper, pickValidValues } from '@heyform-inc/utils'
import { FormModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { normalizeTranslationLanguages, passwordHash } from '@utils'

@Resolver()
@Auth()
export class UpdateFormResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateForm(
    @Form() form: FormModel,
    @User() user: UserModel,
    @Args('input') input: UpdateFormInput
  ): Promise<boolean> {
    let updates: Record<string, any> = pickValidValues(input as any, [
      'name',
      ['active', 'settings.active'],
      ['enableExpirationDate', 'settings.enableExpirationDate'],
      ['expirationTimeZone', 'settings.expirationTimeZone'],
      ['enabledAt', 'settings.enabledAt'],
      ['closedAt', 'settings.closedAt'],
      ['enableTimeLimit', 'settings.enableTimeLimit'],
      ['timeLimit', 'settings.timeLimit'],
      ['captchaKind', 'settings.captchaKind'],
      ['filterSpam', 'settings.filterSpam'],
      ['generatePseudonymId', 'settings.generatePseudonymId'],
      ['enableQuotaLimit', 'settings.enableQuotaLimit'],
      ['quotaLimit', 'settings.quotaLimit'],
      ['enableIpLimit', 'settings.enableIpLimit'],
      ['ipLimitCount', 'settings.ipLimitCount'],
      ['ipLimitTime', 'settings.ipLimitTime'],
      ['enableProgress', 'settings.enableProgress'],
      ['enableQuestionList', 'settings.enableQuestionList'],
      ['enableNavigationArrows', 'settings.enableNavigationArrows'],
      ['locale', 'settings.locale'],
      ['languages', 'settings.languages'],
      ['enableClosedMessage', 'settings.enableClosedMessage'],
      ['closedFormTitle', 'settings.closedFormTitle'],
      ['closedFormDescription', 'settings.closedFormDescription'],
      ['allowArchive', 'settings.allowArchive'],
      ['requirePassword', 'settings.requirePassword'],
      ['enableEmailNotification', 'settings.enableEmailNotification']
    ])

    if (helper.isValid(input.password)) {
      updates['settings.password'] = await passwordHash(input.password!, BCRYPT_SALT)
    }

    if (helper.isTrue(input.redirectOnCompletion)) {
      updates = {
        ...updates,
        ...pickValidValues(input as any, [
          ['redirectOnCompletion', 'settings.redirectOnCompletion'],
          ['redirectUrl', 'settings.redirectUrl'],
          ['redirectDelay', 'settings.redirectDelay']
        ])
      }
    }

    // `pickValidValues` drops empty arrays, but we must persist language updates
    // (including clearing translations to an empty list).
    const hasLanguagesInput =
      Object.prototype.hasOwnProperty.call(input, 'languages') ||
      helper.isNull(input.languages) ||
      helper.isArray(input.languages)

    if (hasLanguagesInput) {
      updates['settings.languages'] = normalizeTranslationLanguages(input.languages)
    }

    if (helper.isValidArray(input.languages)) {
      const currentLanguages = new Set(form.settings?.languages || [])
      const addedLanguages = normalizeTranslationLanguages(input.languages).filter(
        language => !currentLanguages.has(language)
      )

      if (addedLanguages.length > 0) {
        await this.formService.addTranslateQueue(input.formId, form.teamId, user.id, addedLanguages)
      }
    }

    if (input.metaTitle || input.metaDescription || input.metaOGImageUrl) {
      updates = {
        ...updates,
        ...pickValidValues(input as any, [
          ['metaTitle', 'settings.metaTitle'],
          ['metaDescription', 'settings.metaDescription'],
          ['metaOGImageUrl', 'settings.metaOGImageUrl']
        ])
      }
    } else if (helper.isNull(input.metaOGImageUrl)) {
      updates['settings.metaOGImageUrl'] = null
    }

    return this.formService.update(input.formId, updates)
  }
}
