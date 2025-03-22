/**
 * @program: servers
 * @description: EspoCRM Integration
 * @author: Mufeng
 * @date: 2021-06-10 13:11
 **/

import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService, TeamService, UserService } from '@service'
import { Job } from 'bull'
import { BaseQueue, BaseQueueJob } from './base.queue'
import { ESPOCRM_API_KEY, ESPOCRM_API_URL } from '@environments'
import { EspoCRM, EspoCRMAccount, EspoCRMAction, EspoCRMLead } from '@utils'

export interface LeadCreatePayload {
  action: EspoCRMAction.CREATE_LEAD
  userId: string
  lead: EspoCRMLead
}

export interface LeadUpdatePayload {
  action: EspoCRMAction.UPDATE_LEAD
  id: string
  updates: Partial<EspoCRMLead>
}

export interface LeadDeletePayload {
  action: EspoCRMAction.DELETE_LEAD
  id: string
}

export interface AccountCreatePayload {
  action: EspoCRMAction.CREATE_ACCOUNT
  teamId: string
  account: EspoCRMAccount
}

export interface AccountUpdatePayload {
  action: EspoCRMAction.UPDATE_ACCOUNT
  id: string
  updates: Partial<EspoCRMAccount>
}

export interface AccountDeletePayload {
  action: EspoCRMAction.DELETE_ACCOUNT
  id: string
}

export type EspoCRMQueuePayload =
  | LeadCreatePayload
  | LeadUpdatePayload
  | LeadDeletePayload
  | AccountCreatePayload
  | AccountUpdatePayload
  | AccountDeletePayload

interface EspoCRMQueueJob extends BaseQueueJob {
  payload: EspoCRMQueuePayload
}

@Processor('EspoCRMQueue')
export class EspoCRMQueue extends BaseQueue {
  private readonly espoCRM = new EspoCRM({
    apiURL: ESPOCRM_API_URL,
    apiKey: ESPOCRM_API_KEY
  })

  constructor(
    failedTaskService: FailedTaskService,
    private readonly userService: UserService,
    private readonly teamService: TeamService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createRecord(job: Job<EspoCRMQueueJob>): Promise<any> {
    const { payload } = job.data

    switch (payload.action) {
      case EspoCRMAction.CREATE_LEAD:
        const lead = await this.espoCRM.createLead(payload.lead)

        return this.userService.update(payload.userId, {
          crmLeadId: lead.id
        })

      case EspoCRMAction.UPDATE_LEAD:
        return this.espoCRM.updateLead(payload.id, payload.updates)

      case EspoCRMAction.DELETE_LEAD:
        return this.espoCRM.deleteLead(payload.id)

      case EspoCRMAction.CREATE_ACCOUNT:
        const account = await this.espoCRM.createAccount(payload.account)

        return this.teamService.update(payload.teamId, {
          crmAccountId: account.id
        })

      case EspoCRMAction.UPDATE_ACCOUNT:
        return this.espoCRM.updateAccount(payload.id, payload.updates)

      case EspoCRMAction.DELETE_ACCOUNT:
        return this.espoCRM.deleteAccount(payload.id)
    }
  }
}
