/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 4:11 PM
 **/

import { Process, Processor } from '@nestjs/bull'
import { BaseQueue, BaseQueueJob } from './base.queue'
import {
  CdnService,
  FailedTaskService,
  FormService,
  MailService,
  ProjectService,
  TeamService,
  UserService
} from '@service'
import { Job } from 'bull'
import { helper, nanoid } from '@heyform-inc/utils'
import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { BUNNY_URL_PREFIX } from '@environments'
import * as AdmZip from 'adm-zip'

interface ExportTeamDataQueueJob extends BaseQueueJob {
  teamId: string
}

@Processor('ExportTeamDataQueue')
export class ExportTeamDataQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
    private readonly formService: FormService,
    private readonly cdnService: CdnService,
    private readonly mailService: MailService
  ) {
    super(failedTaskService)
  }

  @Process()
  async exportTeamData(job: Job<ExportTeamDataQueueJob>): Promise<any> {
    const team = await this.teamService.findById(job.data.teamId)

    if (!team) {
      return
    }

    const projects = await this.projectService.findAllInTeam(team.id)

    if (helper.isEmpty(projects)) {
      return
    }

    const zip = new AdmZip()

    for (const project of projects) {
      const forms = await this.formService.findAll(
        project.id,
        FormStatusEnum.NORMAL
      )

      if (helper.isValidArray(forms)) {
        for (const form of forms) {
          const data = JSON.stringify(form, null, 4)
          zip.addFile(
            `${project.name}/${form.name}.json`,
            Buffer.from(data, 'utf8')
          )
        }
      }
    }

    const key = `${team.name}-${nanoid()}.zip`
    await this.cdnService.uploadToCdn(key, zip.toBuffer())

    const user = await this.userService.findById(team.ownerId)
    const link = this.cdnService.privateDownloadUrl(BUNNY_URL_PREFIX, key)

    await this.mailService.teamDataExportReady(user.email, link)
  }
}
