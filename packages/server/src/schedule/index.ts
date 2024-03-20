import { BullModule } from '@nestjs/bull'

import { BullOptionsFactory } from '@config'

import { DeleteFormInTrashSchedule } from './delete-form-in-trash.schedule'
import { DeleteUserAccountSchedule } from './delete-user-account.schedule'
import { ResetInviteCodeSchedule } from './reset-invite-code.schedule'

export const ScheduleProviders = {
  DeleteFormInTrashSchedule,
  ResetInviteCodeSchedule,
  DeleteUserAccountSchedule
}

export const ScheduleModules = Object.keys(ScheduleProviders).map(scheduleName => {
  return BullModule.registerQueueAsync({
    name: scheduleName,
    useFactory: BullOptionsFactory
  })
})
