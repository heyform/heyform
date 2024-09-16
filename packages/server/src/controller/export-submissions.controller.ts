import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common'
import { Response } from 'express'

import { flattenFields } from '@heyform-inc/answer-utils'
import { date } from '@heyform-inc/utils'

import { Auth, FormGuard, Team } from '@decorator'
import { ExportSubmissionsDto } from '@dto'
import { TeamModel } from '@model'
import { ExportFileService, FormService, SubmissionService } from '@service'

@Controller()
@Auth()
export class ExportSubmissionsController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService,
    private readonly exportFileService: ExportFileService
  ) {}

  @Get('/export/submissions')
  @FormGuard()
  async exportSubmissions(
    @Query() input: ExportSubmissionsDto,
    @Team() team: TeamModel,
    @Res() res: Response
  ): Promise<void> {
    const form = await this.formService.findById(input.formId)
    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    const submissions = await this.submissionService.findAllByForm(input.formId)
    if (submissions.length < 1) {
      throw new BadRequestException('The submissions does not exist')
    }

    const data = await this.exportFileService.csv(
      flattenFields(form.fields),
      form.hiddenFields,
      submissions
    )
    const dateStr = date().format('YYYY-MM-DD')
    const filename = `${encodeURIComponent(form.name)}-${dateStr}.csv`

    res.header('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  }
}
