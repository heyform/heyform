import { Auth, ProjectGuard, Team, User } from '@decorator'
import { UseTemplateInput } from '@graphql'
import { CaptchaKindEnum, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { Teable } from '@utils'
import {
  TEABLE_API_KEY,
  TEABLE_API_URL,
  TEABLE_TEMPLATE_TABLE_ID
} from '@environments'

@Resolver()
@Auth()
export class UseTemplateResolver {
  private readonly teable = new Teable({
    apiURL: TEABLE_API_URL,
    apiKey: TEABLE_API_KEY
  })

  constructor(private readonly formService: FormService) {}

  /**
   * Duplicate form from template
   */
  @Mutation(returns => String)
  @ProjectGuard()
  async useTemplate(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: UseTemplateInput
  ): Promise<string> {
    // Discard at Dec 20, 2021 (v2021.12.3)
    // await this.formService.checkQuota(team.id, team.plan.formLimit)

    const template = await this.formService.findById(input.templateId)

    if (helper.isEmpty(template)) {
      throw new BadRequestException('The template does not exist')
    }

    const form = {
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: template.name,
      kind: template.kind,
      interactiveMode: template.interactiveMode,
      fields: [],
      _drafts: JSON.stringify(template.fields),
      fieldsUpdatedAt: 0,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true,
        enableEmailNotification: true
      },
      themeSettings: template.themeSettings,
      hiddenFields: [],
      version: 0,
      status: FormStatusEnum.NORMAL
    }

    const record = await this.teable.findRecord(
      TEABLE_TEMPLATE_TABLE_ID,
      input.recordId
    )

    if (record) {
      this.teable.updateRecord(TEABLE_TEMPLATE_TABLE_ID, input.recordId, {
        record: {
          fields: {
            Used: (record.fields.Used || 0) + 1
          }
        }
      })
    }

    return this.formService.create(form)
  }
}
