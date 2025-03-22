import { Auth, TeamGuard } from '@decorator'
import { DeleteContactsInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'

@Resolver()
@Auth()
export class DeleteContactsResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async deleteContacts(
    @Args('input') input: DeleteContactsInput
  ): Promise<boolean> {
    return this.contactService.deleteByIds(input.teamId, input.contactIds)
  }
}
