import { Auth, TeamGuard } from '@decorator'
import { UpdateContactInput } from '@graphql'
import { pickValidValues } from '@heyform-inc/utils'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'

@Resolver()
@Auth()
export class UpdateContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async updateContact(
    @Args('input') input: UpdateContactInput
  ): Promise<boolean> {
    const updates = pickValidValues(input as any, [
      'fullName',
      'email',
      'phoneNumber',
      'jobTitle',
      'note',
      ['groupIds', 'groups']
    ])
    return this.contactService.update(input.teamId, input.contactId, updates)
  }
}
