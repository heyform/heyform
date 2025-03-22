import { Auth, ProjectGuard } from '@decorator'
import { ProjectDetailInput } from '@graphql'
import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, SubmissionService } from '@service'

@Resolver()
@Auth()
export class EmptyProjectTrashResolver {
  constructor(
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {}

  /**
   * Delete form
   *
   * @param input
   */
  @Mutation(returns => Boolean)
  @ProjectGuard()
  async emptyProjectTrash(
    @Args('input') input: ProjectDetailInput
  ): Promise<boolean> {
    const forms = await this.formService.findAll(
      input.projectId,
      FormStatusEnum.TRASH
    )

    if (forms.length > 0) {
      const formIds = forms.map(form => form.id)

      await this.formService.delete(formIds)
      await this.submissionService.deleteAll(formIds)
    }

    return true
  }
}
