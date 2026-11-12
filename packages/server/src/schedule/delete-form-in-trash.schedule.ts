import { Process, Processor } from '@nestjs/bull'

import { FormService, SubmissionService } from '@service'

import { BaseQueue } from '../queue/base.queue'

@Processor('DeleteFormInTrashSchedule')
export class DeleteFormInTrashSchedule extends BaseQueue {
  constructor(
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {
    super()
  }

  @Process()
  async deleteFormInTrash(): Promise<any> {
    const forms = await this.formService.findAllInTrash()

    for (const form of forms) {
      // A form may have been restored since the scan. Only clean up deleted forms.
      if (await this.formService.delete(form.id)) {
        await this.submissionService.deleteAll(form.id)
      }
    }
  }
}
