import { BadRequestException, HttpStatus } from '@nestjs/common'

import { Auth, FormGuard } from '@decorator'
import { FormSchemasType, UpdateFormSchemasInput } from '@graphql'
import { timestamp } from '@heyform-inc/utils'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { assertValidFormNavigation, sanitizeFormDrafts } from '@utils'

@Resolver()
@Auth()
export class UpdateFormSchemasResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => FormSchemasType)
  @FormGuard()
  async updateFormSchemas(@Args('input') input: UpdateFormSchemasInput): Promise<FormSchemasType> {
    const form = await this.formService.findById(input.formId)

    if (form.version > input.version) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'invalid_draft_version',
        message: 'The version provided is not valid'
      })
    }

    const drafts = sanitizeFormDrafts(input.drafts)
    assertValidFormNavigation(drafts)

    const updates = {
      _drafts: JSON.stringify(drafts),
      fieldsUpdatedAt: timestamp(),
      version: input.version + 1
    }

    await this.formService.update(input.formId, updates)

    return {
      drafts,
      version: updates.version,
      canPublish: JSON.stringify(form) !== updates._drafts
    }
  }
}
