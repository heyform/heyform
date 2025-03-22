import { Auth, TeamGuard } from '@decorator'
import { AddContactsToGroupInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'

@Resolver()
@Auth()
export class AddContactsToGroupResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async addContactsToGroup(
    @Args('input') input: AddContactsToGroupInput
  ): Promise<boolean> {
    return this.contactService.updateMany(input.teamId, input.contactIds, {
      $addToSet: {
        groups: input.groupId
      }
    })
  }
}
