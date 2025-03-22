import { Auth, FormGuard } from '@decorator'
import { GitlabInput, GitlabType } from '@graphql'
import { Gitlab, GitlabResultType } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class GitlabGroupsResolver {
  @Query(returns => [GitlabType])
  @FormGuard()
  async gitlabGroups(
    @Args('input') input: GitlabInput
  ): Promise<GitlabResultType[]> {
    const gitlab = Gitlab.init({
      server: input.server,
      clientSecret: input.token
    })

    return gitlab.groups()
  }
}
