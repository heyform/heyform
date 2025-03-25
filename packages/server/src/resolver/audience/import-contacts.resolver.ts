import { Auth, Team, TeamGuard } from '@decorator'
import { ImportContactsInput } from '@graphql'
import { TeamModel } from '@model'
import { gravatar } from '@heyforms/nestjs'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'

@Resolver()
@Auth()
export class ImportContactsResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async importContacts(
    @Team() team: TeamModel,
    @Args('input') input: ImportContactsInput
  ): Promise<boolean> {
    // await this.contactService.checkQuota(
    //   input.teamId,
    //   team.plan?.contactLimit,
    //   input.contacts.length
    // )

    const contacts = input.contacts.map(row => ({
      teamId: input.teamId,
      groups: input.groupIds,
      avatar: gravatar(row.email),
      ...row
    }))
    await this.contactService.insertMany(contacts)
    return true
  }
}
