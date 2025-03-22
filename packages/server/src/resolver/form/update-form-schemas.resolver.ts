import { Auth, FormGuard } from '@decorator'
import { FormSchemasType, UpdateFormSchemasInput } from '@graphql'
import { timestamp } from '@heyform-inc/utils'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { BadRequestException, HttpStatus } from '@nestjs/common'

@Resolver()
@Auth()
export class UpdateFormSchemasResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => FormSchemasType)
  @FormGuard()
  async updateFormSchemas(
    @Args('input') input: UpdateFormSchemasInput
  ): Promise<FormSchemasType> {
    const form = await this.formService.findById(input.formId)

    if (form.version > input.version) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'invalid_draft_version',
        message: 'The version provided is not valid'
      })
    }

    const updates = {
      // Discard at Apr 14, 2022
      // name: input.name,
      // nameSchema: input.nameSchema,
      // welcomePage: input.welcomePage,
      // thankYouPage: input.thankYouPage,
      // Refactor at Jun 22, 2024
      _drafts: JSON.stringify(input.drafts),
      fieldsUpdatedAt: timestamp(),
      version: input.version + 1
    }

    await this.formService.update(input.formId, updates)

    return {
      drafts: input.drafts,
      version: updates.version,
      canPublish: JSON.stringify(form) !== updates._drafts
    }
  }
}
