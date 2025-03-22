import { Auth, TeamGuard } from '@decorator'
import { ContactsInput, ContactsResultType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'

@Resolver()
@Auth()
export class ContactsResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Query(returns => ContactsResultType)
  async contacts(
    @Args('input') input: ContactsInput
  ): Promise<ContactsResultType> {
    const total = await this.contactService.count(
      input.teamId,
      input.keyword,
      input.groupIds
    )
    let contacts: any[] = []

    if (total > 0) {
      contacts = await this.contactService.findAll(
        input.teamId,
        input.groupIds,
        input.keyword,
        input.page,
        input.limit
      )
    }

    return {
      total,
      contacts
    }
  }
}
