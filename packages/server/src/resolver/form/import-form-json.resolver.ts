import { Auth, Project, ProjectGuard, Team, User } from '@decorator'
import { ImportFormFromJSONInput } from '@graphql'
import {
  CaptchaKindEnum,
  FormStatusEnum
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { ProjectModel, TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class ImportFormJsonResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => String)
  @ProjectGuard()
  async importFormFromJSON(
    @Team() team: TeamModel,
    @Project() project: ProjectModel,
    @User() user: UserModel,
    @Args('input') input: ImportFormFromJSONInput
  ): Promise<string> {
    try {
      // Parse the JSON string to an object
      const formData = JSON.parse(input.formJson)

      // Validate required fields
      if (!formData.name || !helper.isValidArray(formData.fields)) {
        throw new BadRequestException(
          'Invalid form JSON: missing required fields'
        )
      }

      // Create the form with data from the JSON
      return await this.formService.create({
        name: formData.name,
        teamId: project.teamId,
        projectId: project.id,
        memberId: user.id,
        fields: formData.fields,
        hiddenFields: formData.hiddenFields || [],
        logics: formData.logics || [],
        variables: formData.variables || [],
        settings: formData.settings || {
          active: false,
          captchaKind: CaptchaKindEnum.NONE,
          filterSpam: false,
          allowArchive: true,
          requirePassword: false,
          locale: 'en',
          enableQuestionList: true,
          enableNavigationArrows: true
        },
        themeSettings: formData.themeSettings || {},
        interactiveMode: formData.interactiveMode,
        kind: formData.kind,
        status: FormStatusEnum.NORMAL
      })
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format')
      }
      throw error
    }
  }
}
