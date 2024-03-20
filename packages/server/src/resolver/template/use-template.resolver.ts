import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { CaptchaKindEnum, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

import { Auth, ProjectGuard, Team, User } from '@decorator'
import { UseTemplateInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { FormService, TemplateService } from '@service'

@Resolver()
@Auth()
export class UseTemplateResolver {
  constructor(
    private readonly formService: FormService,
    private readonly templateService: TemplateService
  ) {}

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
    const template = await this.templateService.findById(input.templateId)

    if (helper.isEmpty(template)) {
      throw new BadRequestException('The template does not exist')
    }

    const form = {
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: `${template.name} (copy)`,
      description: template.description,
      kind: template.kind,
      interactiveMode: template.interactiveMode,
      settings: {
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: true,
        active: false,
        published: true,
        allowArchive: true,
        requirePassword: false
      },
      fields: template.fields,
      themeSettings: template.themeSettings,
      draft: true,
      status: FormStatusEnum.NORMAL
    }

    const result = await this.formService.create(form)

    if (helper.isValid(result)) {
      await this.templateService.updateUsedCount(input.templateId)
    }

    return result
  }
}
