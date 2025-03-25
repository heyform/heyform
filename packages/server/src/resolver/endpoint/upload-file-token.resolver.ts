import {
  BUNNY_URL_PREFIX,
  UPLOAD_FILE_SIZE,
  UPLOAD_FILE_TYPE
} from '@environments'
import { CdnTokenType, UploadFormFileInput } from '@graphql'
import { EndpointAnonymousIdGuard } from '@guard'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'
import { SubscriptionStatusEnum } from '@model'
import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { CdnService, FormService, TeamService } from '@service'

@Resolver()
@UseGuards(EndpointAnonymousIdGuard)
export class UploadFileTokenResolver {
  constructor(
    private readonly cdnService: CdnService,
    private readonly formService: FormService,
    private readonly teamService: TeamService
  ) {}

  @Mutation(returns => CdnTokenType)
  async uploadFileToken(
    @Args('input') input: UploadFormFileInput
  ): Promise<CdnTokenType> {
    // 检查文件类型
    if (!UPLOAD_FILE_TYPE.includes(input.mime)) {
      throw new BadRequestException('Upload file type not supported')
    }

    const form = await this.formService.findById(input.formId)

    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    if (form.suspended) {
      throw new BadRequestException('The form is suspended')
    }

    if (form.settings.active !== true) {
      throw new BadRequestException('The form does not exist')
    }

    // Check if this form can upload attachments or signature
    const fieldIdx = form!.fields?.findIndex(
      row =>
        row.kind === FieldKindEnum.FILE_UPLOAD ||
        row.kind === FieldKindEnum.SIGNATURE
    )
    if (fieldIdx < 0) {
      throw new BadRequestException("Can't upload file to the form")
    }

    // Check storage quota
    const team = await this.teamService.findWithPlanById(form.teamId)

    /**
     * If team subscription has expired, submit submission is prohibited
     */
    if (team.subscription.status !== SubscriptionStatusEnum.ACTIVE) {
      throw new BadRequestException(
        'The workspace file storage quota exceeds, new files are no longer accepted'
      )
    }

    // if (team.storageQuota >= bytes(team.plan.storageLimit)) {
    //   throw new BadRequestException(
    //     'The workspace file storage quota exceeds, new files are no longer accepted'
    //   )
    // }

    const key = `${team.id}/${form.id}/${nanoid()}_${encodeURIComponent(
      input.filename
    )}`
    const token = this.cdnService.uploadToken(
      UPLOAD_FILE_TYPE,
      UPLOAD_FILE_SIZE,
      JSON.stringify({
        teamId: team.id,
        formId: form.id
      })
    )

    return {
      token,
      urlPrefix: BUNNY_URL_PREFIX,
      key
    }
  }
}
