import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper, pickValidValues } from '@heyform-inc/utils'

import { Auth, FormGuard, Team } from '@decorator'
import { UpdateFormInput } from '@graphql'
import { TeamModel } from '@model'
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
      ['published', 'settings.published'],
      ['enableQuotaLimit', 'settings.enableQuotaLimit'],
      ['quotaLimit', 'settings.quotaLimit'],
      ['enableIpLimit', 'settings.enableIpLimit'],
      ['ipLimitCount', 'settings.ipLimitCount'],
      ['ipLimitTime', 'settings.ipLimitTime'],
      ['enableProgress', 'settings.enableProgress'],
      ['locale', 'settings.locale'],
      ['enableClosedMessage', 'settings.enableClosedMessage'],
      ['closedFormTitle', 'settings.closedFormTitle'],
      ['closedFormDescription', 'settings.closedFormDescription'],
      ['allowArchive', 'settings.allowArchive']
    ])

    if (helper.isTrue(input.active)) {
      updates.draft = false
    }

    if (!helper.isNil(input.password) || !helper.isNil(input.requirePassword)) {
      updates = {
        ...updates,
        ...pickValidValues(input as any, [
          ['password', 'settings.password'],
          ['requirePassword', 'settings.requirePassword']
        ])
      }
    }

    if (!input.allowArchive) {
      await this.submissionService.deleteByIds(input.formId)
    }

    return this.formService.update(input.formId, updates)
  }
}
