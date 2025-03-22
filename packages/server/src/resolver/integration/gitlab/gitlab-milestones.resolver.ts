import { Auth, FormGuard } from '@decorator'
import { GitlabMembersInput, GitlabType } from '@graphql'
import { Gitlab, GitlabResultType } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class GitlabMilestonesResolver {
  @Query(returns => [GitlabType])
  @FormGuard()
  async gitlabMilestones(
    @Args('input') input: GitlabMembersInput
  ): Promise<GitlabResultType[]> {
    const gitlab = Gitlab.init({
      server: input.server,
      clientSecret: input.token
    })
    return gitlab.milestones(input.project)
  }
}
