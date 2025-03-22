import { Auth, FormGuard } from '@decorator'
import { GitlabProjectsInput, GitlabType } from '@graphql'
import { Gitlab, GitlabResultType } from '@heyforms/integrations'
import { Args, Query, Resolver } from '@nestjs/graphql'

@Resolver()
@Auth()
export class GitlabProjectsResolver {
  @Query(returns => [GitlabType])
  @FormGuard()
  async gitlabProjects(
    @Args('input') input: GitlabProjectsInput
  ): Promise<GitlabResultType[]> {
    const gitlab = Gitlab.init({
      server: input.server,
      clientSecret: input.token
    })

    return gitlab.projects(input.group)
  }
}
