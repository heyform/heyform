import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard, Team } from '@decorator'
import { TeamModel } from '@model'
import { FormDetailInput } from '@graphql'
import { FormCustomReportService } from '@service'
import { BadRequestException } from '@nestjs/common'

@Resolver()
@Auth()
export class CreateFormCustomReportResolver {
  constructor(
    private readonly formCustomReportService: FormCustomReportService
  ) {}

  @Mutation(returns => String)
  @FormGuard()
  async createFormCustomReport(
    @Team() team: TeamModel,
    @Args('input') input: FormDetailInput
  ): Promise<string> {
    if (!team.plan.formReport) {
      throw new BadRequestException('Upgrade your plan to setup custom report')
    }

    const report = await this.formCustomReportService.findByFormId(input.formId)

    if (report) {
      return report.id
    }

    return this.formCustomReportService.create({
      formId: input.formId,
      hiddenFields: [],
      enablePublicAccess: true
    })
  }
}
