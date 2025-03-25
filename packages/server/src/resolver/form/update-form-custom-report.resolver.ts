import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { UpdateFormCustomReportInput } from '@graphql'
import { FormCustomReportService } from '@service'
import { pickObject } from '@heyform-inc/utils'

@Resolver()
@Auth()
export class UpdateFormCustomReportResolver {
  constructor(
    private readonly formCustomReportService: FormCustomReportService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormCustomReport(
    // @Team() team: TeamModel,
    @Args('input') input: UpdateFormCustomReportInput
  ): Promise<boolean> {
    // if (!team.plan.formReport) {
    //   throw new BadRequestException('Upgrade your plan to setup custom report')
    // }

    return this.formCustomReportService.update(
      input.formId,
      pickObject(input, [], ['formId'])
    )
  }
}
