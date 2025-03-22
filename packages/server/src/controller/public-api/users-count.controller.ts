import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { helper } from '@heyform-inc/utils'
const { isEmpty } = helper
import { PUBLIC_API_VERIFICATION_KEY } from '@environments'
import { PublicApiDto } from '@dto'
import { RedisService, UserService } from '@service'

const REDIS_KEY = 'public_users_count'

@Controller()
export class UsersCountController {
  constructor(
    private userService: UserService,
    private redisService: RedisService
  ) {}

  @Get('/users-count')
  async index(@Query() input: PublicApiDto) {
    if (input.key !== PUBLIC_API_VERIFICATION_KEY) {
      throw new BadRequestException('Invalid params')
    }

    let count: string | number = await this.redisService.get(REDIS_KEY)

    if (isEmpty(count)) {
      count = await this.userService._internalCountAll()

      await this.redisService.set({
        key: REDIS_KEY,
        value: count,
        duration: '10m'
      })
    }

    return {
      count
    }
  }
}
