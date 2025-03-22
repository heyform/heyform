import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService, FormService } from '@service'
import { BaseQueue } from '../queue/base.queue'

@Processor('DeleteFormInTrashSchedule')
export class DeleteFormInTrashSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly formService: FormService
  ) {
    super(failedTaskService)
  }

  @Process()
  async deleteFormInTrash(): Promise<any> {
    const forms = await this.formService.findAllInTrash()

    if (forms.length > 0) {
      await this.formService.delete(forms.map(row => row.id))
    }
  }
}
