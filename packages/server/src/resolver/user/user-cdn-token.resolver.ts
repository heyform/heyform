import { Auth, User } from '@decorator'
import {
  BUNNY_URL_PREFIX,
  UPLOAD_IMAGE_SIZE,
  UPLOAD_IMAGE_TYPE
} from '@environments'
import { CdnTokenInput, CdnTokenType } from '@graphql'
import { nanoid } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { CdnService } from '@service'

@Resolver()
@Auth()
export class UserCdnTokenResolver {
  constructor(private readonly cdnService: CdnService) {}

  @Query(returns => CdnTokenType)
  userCdnToken(
    @User() user: UserModel,
    @Args('input') input: CdnTokenInput
  ): CdnTokenType {
    if (!UPLOAD_IMAGE_TYPE.includes(input.mime)) {
      throw new BadRequestException('Upload file type not supported')
    }

    const key = `${user.id}/${nanoid()}_${encodeURIComponent(input.filename)}`
    const token = this.cdnService.uploadToken(
      UPLOAD_IMAGE_TYPE,
      UPLOAD_IMAGE_SIZE,
      JSON.stringify({
        userId: user.id
      })
    )

    return {
      token,
      urlPrefix: BUNNY_URL_PREFIX,
      key
    }
  }
}
