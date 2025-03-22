import { Auth, FormGuard } from '@decorator'
import { GitlabMembersInput, GitlabType } from '@graphql'
import { Gitlab, GitlabResultType } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class GitlabLabelsResolver {
  @Query(returns => [GitlabType])
  @FormGuard()
  async gitlabLabels(
    @Args('input') input: GitlabMembersInput
  ): Promise<GitlabResultType[]> {
    const gitlab = Gitlab.init({
      server: input.server,
      clientSecret: input.token
    })

    return gitlab.labels(input.project)
  }
}
