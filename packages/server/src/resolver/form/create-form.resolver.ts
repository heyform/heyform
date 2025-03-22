import { Auth, ProjectGuard, Team, User } from '@decorator'
import { CreateFormInput } from '@graphql'
import {
  CaptchaKindEnum,
  FieldKindEnum,
  FormStatusEnum
} from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class CreateFormResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Create form
   */
  @Mutation(returns => String)
  @ProjectGuard()
  async createForm(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: CreateFormInput
  ): Promise<string> {
    // Discard at Dec 20, 2021 (v2021.12.3)
    // await this.formService.checkQuota(team.id, team.plan.formLimit)

    const fields = [
      // Example field
      {
        id: nanoid(12),
        title: null,
        description: null,
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: false },
        layout: {
          mediaType: 'image',
          mediaUrl:
            'https://images.unsplash.com/photo-1646013532943-d5b86e8689b8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80',
          align: 'split_right',
          brightness: 0
        }
      },
      {
        id: nanoid(12),
        title: ['Thank you!'],
        description: [
          'Thanks for completing this form. Now create your own form.'
        ],
        kind: FieldKindEnum.THANK_YOU
      }
    ]

    return await this.formService.create({
      teamId: team.id,
      memberId: user.id,
      fields: [],
      _drafts: JSON.stringify(fields),
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
      hiddenFields: [],
      version: 0,
      status: FormStatusEnum.NORMAL,
      ...input
    })
  }
}
