import { Auth, Team, TeamGuard, User } from '@decorator'
import {
  BUNNY_URL_PREFIX,
  UPLOAD_IMAGE_SIZE,
  UPLOAD_IMAGE_TYPE
} from '@environments'
import { CdnTokenType, TeamCdnTokenInput } from '@graphql'
import { nanoid } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { CdnService } from '@service'

@Resolver()
@Auth()
export class TeamCdnTokenResolver {
  constructor(private readonly cdnService: CdnService) {}

  @Query(returns => CdnTokenType)
  @TeamGuard()
  teamCdnToken(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: TeamCdnTokenInput
  ): CdnTokenType {
    if (!UPLOAD_IMAGE_TYPE.includes(input.mime)) {
      throw new BadRequestException('Upload file type not supported')
    }

    const key = `${team.id}/${user.id}/${nanoid()}_${encodeURIComponent(
      input.filename
    )}`
    const token = this.cdnService.uploadToken(
      UPLOAD_IMAGE_TYPE,
      UPLOAD_IMAGE_SIZE,
      JSON.stringify({
        teamId: team.id,
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
