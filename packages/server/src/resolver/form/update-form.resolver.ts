import { Auth, Form, FormGuard, Team } from '@decorator'
import { UpdateFormInput } from '@graphql'
import { helper, pickValidValues } from '@heyform-inc/utils'
import { FormModel, TeamModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, SubmissionService } from '@service'

@Resolver()
@Auth()
export class UpdateFormResolver {
  constructor(
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {}

  /**
   * Update form
   *
   * @param team
   * @param input
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async updateForm(
    @Team() team: TeamModel,
    @Form() form: FormModel,
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
      ['password', 'settings.password'],
      ['requirePassword', 'settings.requirePassword'],
      ['enableEmailNotification', 'settings.enableEmailNotification']
    ])

    // Discard at Dec 20, 2021 (v2021.12.3)
    // Refactor at Jun 12, 2024 (v3.0.0)
    if (helper.isTrue(input.redirectOnCompletion)) {
      if (team.plan.customUrlRedirects) {
        updates = {
          ...updates,
          ...pickValidValues(input as any, [
            ['redirectOnCompletion', 'settings.redirectOnCompletion'],
            ['redirectUrl', 'settings.redirectUrl'],
            ['redirectDelay', 'settings.redirectDelay']
          ])
        }
      } else {
        updates['settings.redirectOnCompletion'] = false
      }
    }

    // Add at Sep 23, 2022
    if (input.allowArchive === false) {
      await this.submissionService.deleteByIds(input.formId)
    }

    if (
      helper.isValidArray(input.languages) &&
      !input.languages.every(t => form.settings?.languages?.includes(t))
    ) {
      if (team.plan.multiLanguage) {
        this.formService.addTranslateQueue(input.formId, input.languages!)
      } else {
        input.languages = []
      }
    }

    // Add at Jul 12, 2024
    if (input.metaTitle || input.metaDescription || input.metaOGImageUrl) {
      if (team.plan.customMetaData) {
        updates = {
          ...updates,
          ...pickValidValues(input as any, [
            ['metaTitle', 'settings.metaTitle'],
            ['metaDescription', 'settings.metaDescription'],
            ['metaOGImageUrl', 'settings.metaOGImageUrl']
          ])
        }
      }
    } else if (helper.isNull(input.metaOGImageUrl)) {
      updates['settings.metaOGImageUrl'] = null
    }

    return this.formService.update(input.formId, updates)
  }
}
