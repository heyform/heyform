/**
 * Created by jiangwei on 2020/10/22.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { Auth, FormGuard } from '@decorator'
import { ExportSubmissionsDto } from '@dto'
import { date } from '@heyform-inc/utils'
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res
} from '@nestjs/common'
import { ExportFileService, FormService, SubmissionService } from '@service'
import { Response } from 'express'

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
    @Res() res: Response
  ): Promise<void> {
    const form = await this.formService.findById(input.formId)
    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    // 获取所有的Submission
    const submissions = await this.submissionService.findAllByForm(input.formId)
    if (submissions.length < 1) {
      throw new BadRequestException('The submissions does not exist')
    }

    const data = await this.exportFileService.csv(form, submissions)

    const dateStr = date().format('YYYY-MM-DD')
    const filename = `${encodeURIComponent(form.name)}-${dateStr}.csv`

    res.header('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  }
}
