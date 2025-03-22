import { ENCRYPTION_KEY } from '@environments'
import { VerifyPasswordInput } from '@graphql'
import { EndpointAnonymousIdGuard } from '@guard'
import { aesEncryptObject } from '@heyforms/nestjs'
import { timestamp } from '@heyform-inc/utils'
import { BadRequestException, Headers, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@UseGuards(EndpointAnonymousIdGuard)
export class FormPasswordResolver {
  constructor(private readonly formService: FormService) {}

  @Query(returns => String)
  async verifyFormPassword(
    @Headers('x-anonymous-id') anonymousId: string,
    @Args('input') input: VerifyPasswordInput
  ): Promise<string> {
    const form = await this.formService.findById(input.formId)

    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    if (form.suspended) {
      throw new BadRequestException('The form is suspended')
    }

    if (form.settings.active !== true) {
      throw new BadRequestException('The form does not active')
    }

    if (
      !form.settings.requirePassword ||
      input.password !== form.settings.password
    ) {
      throw new BadRequestException('The password does not match')
    }

    return aesEncryptObject(
      {
        timestamp: timestamp(),
        anonymousId,
        password: input.password
      },
      ENCRYPTION_KEY
    )
  }
}
