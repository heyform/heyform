import { Auth, Form, FormGuard, Team } from '@decorator'
import { APP_HOMEPAGE } from '@environments'
import { ShareToAudienceInput } from '@graphql'
import { FormModel, TeamModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService, MailService } from '@service'

@Resolver()
@Auth()
export class ShareToAudienceResolver {
  constructor(
    private readonly contactService: ContactService,
    private readonly mailService: MailService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async shareToAudience(
    @Team() team: TeamModel,
    @Form() form: FormModel,
    @Args('input') input: ShareToAudienceInput
  ): Promise<boolean> {
    const contacts = await this.contactService.findAll(
      team.id,
      input.groupIds,
      undefined,
      1,
      2000
    )

    if (contacts.length > 0) {
      for (const contact of contacts) {
        this.mailService.formInvitation(
          contact.email,
          `${APP_HOMEPAGE}/f/${form.id}?contactId=${contact.id}`
        )
      }
    }

    return true
  }
}
