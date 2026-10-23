import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JobOptions, Queue } from 'bull'
import { Model } from 'mongoose'

import { AppService } from './app.service'
import { FormModel, IntegrationModel, IntegrationStatusEnum } from '@model'

import { AppDefinition } from '../apps/types'

/**
 * Bull options for one delivery job of the app. Only the options the app sets
 * are passed, so the rest keep the queue's BULL_JOB_* defaults.
 */
export function getAppJobOptions(app: AppDefinition): JobOptions {
  const options: JobOptions = {}
  const queue = app.queue

  if (queue?.attempts !== undefined) {
    options.attempts = queue.attempts
  }

  if (queue?.backoff !== undefined) {
    options.backoff =
      typeof queue.backoff === 'number' ? { type: 'fixed', delay: queue.backoff } : queue.backoff
  }

  if (queue?.timeout !== undefined) {
    options.timeout = queue.timeout
  }

  return options
}

@Injectable()
export class IntegrationService {
  constructor(
    @InjectModel(IntegrationModel.name)
    private readonly integrationModel: Model<IntegrationModel>,
    private readonly appService: AppService,
    @InjectQueue('IntegrationQueue') private readonly integrationQueue: Queue,
    @InjectQueue('SubmissionNotificationQueue') private readonly submissionNotificationQueue: Queue
  ) {}

  async findById(id: string): Promise<IntegrationModel | null> {
    return this.integrationModel.findById(id)
  }

  async findAllInForm(formId: string): Promise<IntegrationModel[]> {
    return this.integrationModel.find({ formId })
  }

  async findAllInFormByApps(formId: string, appIds: string[]): Promise<IntegrationModel[]> {
    return this.integrationModel.find({
      formId,
      appId: {
        $in: appIds
      }
    })
  }

  async findOne(formId: string, appId: string): Promise<IntegrationModel | null> {
    return this.integrationModel.findOne({
      formId,
      appId
    })
  }

  async create(integration: IntegrationModel | any): Promise<string | undefined> {
    const result = await this.integrationModel.create(integration as any)
    return result.id
  }

  async update(id: string, updates: Record<string, any>): Promise<any> {
    const result = await this.integrationModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return result.acknowledged
  }

  async updateAllBy(conditions: Record<string, any>, updates: Record<string, any>): Promise<any> {
    const result = await this.integrationModel.updateMany(conditions, updates)
    return result.matchedCount > 0
  }

  // --- Team connections ---------------------------------------------------------

  async findAllByConnection(connectionId: string): Promise<IntegrationModel[]> {
    return this.integrationModel.find({ connectionId })
  }

  async findAllByConnections(connectionIds: string[]): Promise<IntegrationModel[]> {
    return this.integrationModel.find({ connectionId: { $in: connectionIds } })
  }

  // The connection stopped working: its active integrations wait for a reconnect
  async markConnectionNeedsReconnect(connectionId: string): Promise<void> {
    await this.integrationModel.updateMany(
      { connectionId, status: IntegrationStatusEnum.ACTIVE },
      { status: IntegrationStatusEnum.NEEDS_RECONNECT }
    )
  }

  // The connection was removed: its integrations need another account
  async detachConnection(connectionId: string): Promise<void> {
    await this.markConnectionNeedsReconnect(connectionId)
    await this.integrationModel.updateMany({ connectionId }, { $unset: { connectionId: 1 } })
  }

  async createOrUpdate(
    formId: string,
    appId: string,
    updates: Partial<IntegrationModel>
  ): Promise<string> {
    const integration = await this.findOne(formId, appId)

    if (integration) {
      await this.update(integration.id, updates)
      return integration.id
    }

    return this.create({
      formId,
      appId,
      ...updates
    })
  }

  public async delete(formId: string, appId: string): Promise<boolean> {
    const result = await this.integrationModel.deleteOne({
      formId,
      appId
    })
    return (result.deletedCount ?? 0) > 0
  }

  public async addQueue(form: FormModel, submissionId: string): Promise<void> {
    // Email notification Queue
    if ((form.settings as any)?.enableEmailNotification) {
      this.submissionNotificationQueue.add({
        formId: form.id,
        submissionId
      })
    }

    const integrations = await this.integrationModel.find({
      formId: form.id,
      status: IntegrationStatusEnum.ACTIVE
    })

    for (const integration of integrations) {
      const app = this.appService.findById(integration.appId)

      if (app) {
        this.integrationQueue.add(
          {
            appId: integration.appId,
            formId: form.id,
            integrationId: integration.id,
            submissionId
          },
          getAppJobOptions(app)
        )
      }
    }
  }
}
