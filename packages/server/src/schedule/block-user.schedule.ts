/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 1:44 PM
 **/

import { Process, Processor } from '@nestjs/bull'
import {
  BlockKeywordService,
  FailedTaskService,
  FormService,
  UserService
} from '@service'
import { BaseQueue } from '../queue/base.queue'
import { helper } from '@heyform-inc/utils'

@Processor('BlockUserSchedule')
export class BlockUserSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly userService: UserService,
    private readonly formService: FormService,
    private readonly blockKeywordService: BlockKeywordService
  ) {
    super(failedTaskService)
  }

  @Process()
  async BlockUser(): Promise<any> {
    const blockKeywords = await this.blockKeywordService.findAll()

    if (blockKeywords.length < 1) {
      return
    }

    const forms = await this.formService.findAllByFieldLength()

    if (forms.length < 1) {
      return
    }

    const keywords = blockKeywords.map(row => row.keyword.toLowerCase())

    const unblocked = forms.filter(form => {
      const content = JSON.stringify(form.fields).toLowerCase()
      const matches = content.match(/https?:\/\//gi)

      return (
        (matches && matches.length > 8) ||
        keywords.some(row => content.includes(row))
      )
    })

    if (unblocked.length > 0) {
      const userIds = helper.uniqueArray(unblocked.map(row => row.memberId))

      await this.formService.updateMany(
        unblocked.map(row => row.id),
        {
          suspended: true
        }
      )
      await this.userService.blockUsers(userIds)

      this.logger.info(`Blocked ${userIds.length} users`)
    }
  }
}
