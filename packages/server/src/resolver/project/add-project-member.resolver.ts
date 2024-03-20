import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, ProjectGuard } from '@decorator'
import { ProjectMemberInput } from '@graphql'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class AddProjectMemberResolver {
  constructor(private readonly projectService: ProjectService) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async addProjectMember(@Args('input') input: ProjectMemberInput): Promise<boolean> {
    const member = await this.projectService.findMemberById(input.projectId, input.memberId)

    if (member) {
      throw new BadRequestException('The member already exists in this project')
    }

    return this.projectService.createMember({
      projectId: input.projectId,
      memberId: input.memberId
    })
  }
}
