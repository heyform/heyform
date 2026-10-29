import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common'
import { Response } from 'express'

import { Auth, FormGuard } from '@decorator'
import { ExportSubmissionsDto } from '@dto'
import { flattenFields } from '@heyform-inc/answer-utils'
import { date } from '@heyform-inc/utils'
import { ExportFileService, FormService, SubmissionService } from '@service'
import { isSubmissionIpVisible } from '@utils'

@Controller()
@Auth()
export class ExportSubmissionsController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService,
    private readonly exportFileService: ExportFileService
  ) {}

  @Get('/api/export/submissions')
  @FormGuard()
  async exportSubmissions(
    @Query() input: ExportSubmissionsDto,
    @Res() res: Response
  ): Promise<void> {
    const form = await this.formService.findById(input.formId)
    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    const withIp = isSubmissionIpVisible(form as any)
    const submissions = await this.submissionService.findAllByForm(input.formId, withIp)
    if (submissions.length < 1) {
      throw new BadRequestException('The submissions does not exist')
    }

    const data = await this.exportFileService.csv(
      flattenFields(form.fields),
      form.hiddenFields,
      submissions,
      withIp
    )
    const dateStr = date().format('YYYY-MM-DD')
    const filename = `${encodeURIComponent(form.name)}-${dateStr}.csv`

    res.header('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  }
}
