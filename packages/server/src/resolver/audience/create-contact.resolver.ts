import { Auth, Team, TeamGuard } from '@decorator'
import { CreateContactInput } from '@graphql'
import { gravatar } from '@heyforms/nestjs'
import { TeamModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ContactService } from '@service'
import { BadRequestException } from '@nestjs/common'

@Resolver()
@Auth()
export class CreateContactResolver {
  constructor(private readonly contactService: ContactService) {}

  @TeamGuard()
  @Mutation(returns => String)
  async createContact(
    @Team() team: TeamModel,
    @Args('input') input: CreateContactInput
  ): Promise<string> {
    await this.contactService.checkQuota(input.teamId, team.plan.contactLimit)

    // 检查是否已经存在
    const exists = await this.contactService.findByTeamAndEmail(
      input.teamId,
      input.email
    )

    if (exists) {
      throw new BadRequestException('Contact already exists in the workspace')
    }

    // TODO - 校验 groupIds 属于这个 team
    return this.contactService.create({
      teamId: input.teamId,
      email: input.email,
      fullName: input.fullName,
      avatar: gravatar(input.email),
      jobTitle: input.jobTitle,
      phoneNumber: input.phoneNumber,
      groups: input.groupIds
    })
  }
}
