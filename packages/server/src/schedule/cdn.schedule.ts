import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CdnSchedule {
  @Cron('0 0 * * *')
  deleteCdnFiles() {
    //
  }
}
