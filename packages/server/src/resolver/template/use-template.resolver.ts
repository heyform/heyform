import { CaptchaKindEnum, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { BadRequestException } from '@nestjs/common'

import { Auth, ProjectGuard, Team, User } from '@decorator'
import { UseTemplateInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, TemplateService } from '@service'

const DEFAULT_FORM_NAME = 'Untitled'

@Resolver()
@Auth()
export class UseTemplateResolver {
  constructor(
    private readonly formService: FormService,
    private readonly templateService: TemplateService
  ) {}

  @Mutation(returns => String)
  @ProjectGuard()
  async useTemplate(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: UseTemplateInput
  ): Promise<string> {
    const template = await this.templateService.findPublishedById(input.templateId)

    if (helper.isEmpty(template)) {
      throw new BadRequestException('The template does not exist')
    }

    const form = {
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: helper.isValid(template.name?.trim()) ? template.name.trim() : DEFAULT_FORM_NAME,
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
      hiddenFields: template.hiddenFields || [],
      logics: [],
      draftLogics: template.logics || [],
      variables: template.variables || [],
      translations: template.translations || {},
      version: 0,
      status: FormStatusEnum.NORMAL
    }

    return this.formService.create(form)
  }
}
