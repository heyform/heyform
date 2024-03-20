import { Mutation, Resolver } from '@nestjs/graphql'

import { Auth, User } from '@decorator'
import { UserModel } from '@model'
import { RedisService, UserService } from '@service'

@Resolver()
@Auth()
export class CancelUserDeletionResolver {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService
  ) {}

  @Mutation(returns => Boolean)
  async cancelUserDeletion(@User() user: UserModel): Promise<boolean> {
    const key = `UserDeletion:${user.id}`

    const result = await this.userService.update(user.id, {
      isDeletionScheduled: false,
      deletionScheduledAt: 0
    })

    await this.redisService.del(key)

    return result
  }
}
