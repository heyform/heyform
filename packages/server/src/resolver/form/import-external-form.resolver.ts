import { Auth, Project, ProjectGuard, Team, User } from '@decorator'
import { ImportExternalFormInput } from '@graphql'
import { CaptchaKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { ProjectModel, TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { htmlFormFields } from '@utils'
import got from 'got'

const USER_AGENT =
  'Mozilla/5.0 (MacBook Air; M1 Mac OS X 11_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/604.1'

@Resolver()
@Auth()
export class ImportExternalFormResolver {
  constructor(private readonly formService: FormService) {}

  @Query(returns => String)
  @ProjectGuard()
  async importExternalForm(
    @Team() team: TeamModel,
    @Project() project: ProjectModel,
    @User() user: UserModel,
    @Args('input') input: ImportExternalFormInput
  ): Promise<string> {
    const html = await got
      .get(input.url, {
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 30_000
      })
      .text()

    const fields: FormField[] = htmlFormFields(html)

    if (helper.isEmpty(fields)) {
      throw new BadRequestException(
        'No form found on the page. Please check the URL you have entered.'
      )
    }

    await this.formService.checkQuota(team.id, team.plan.formLimit)

    return await this.formService.create({
      name: 'Untitled form',
      teamId: project.teamId,
      memberId: user.id,
      settings: {
        active: true,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true
      },
      fields,
      projectId: project.id,
      ...input
    })
  }
}
