import { Auth, FormGuard } from '@decorator'
import { GitlabMembersInput, GitlabType } from '@graphql'
import { Gitlab, GitlabResultType } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class GitlabMembersResolver {
  @Query(returns => [GitlabType])
  @FormGuard()
  async gitlabMembers(
    @Args('input') input: GitlabMembersInput
  ): Promise<GitlabResultType[]> {
    const gitlab = Gitlab.init({
      server: input.server,
      clientSecret: input.token
    })
    return gitlab.members(input.project)
  }
}
