import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JobOptions, Queue } from 'bull'
import { Model } from 'mongoose'

import { AppService } from './app.service'
import {
  FormModel,
  IntegrationModel,
  IntegrationRecordModel,
  IntegrationRecordStatusEnum,
  IntegrationStatusEnum,
  MAX_WAITING_RECORDS
} from '@model'
import { Logger, mapToObject } from '@utils'

import { AppDefinition } from '../apps/types'

// Longest error message kept on a delivery record
const RECORD_ERROR_MAX_LENGTH = 500

// How long a resend waits for a job of the same submission that's still running
const RUNNING_JOB_WAIT = 2 * 60_000

function shortenError(error?: string): string | undefined {
  return error && error.length > RECORD_ERROR_MAX_LENGTH
    ? `${error.slice(0, RECORD_ERROR_MAX_LENGTH - 1)}…`
    : error
}

export interface IntegrationJobData {
  appId: string
  integrationId: string
  formId: string
  submissionId: string
}

export interface WaitingRecordInput extends IntegrationJobData {
  // Attempts made before the submission had to wait
  attempt?: number
  maxAttempts?: number
  error?: string
}

/**
 * One job per submission and integration. A job that's still queued keeps
 * this id, so a submission can't be queued twice for the same integration.
 */
export function integrationJobId(integrationId: string, submissionId: string): string {
  return `${integrationId}-${submissionId}`
}

export interface IntegrationRecordInput {
  formId: string
  appId: string
  integrationId: string
  submissionId: string
  status: IntegrationRecordStatusEnum
  attempt: number
  maxAttempts: number
  willRetry?: boolean
  error?: string
}

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
  private readonly logger = new Logger(IntegrationService.name)

  constructor(
    @InjectModel(IntegrationModel.name)
    private readonly integrationModel: Model<IntegrationModel>,
    @InjectModel(IntegrationRecordModel.name)
    private readonly integrationRecordModel: Model<IntegrationRecordModel>,
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

  /**
   * What the public form page needs for each of the form's active page apps,
   * keyed by app id. It's public, so only what each app's page() returns is
   * included, never the config itself. An app whose page() throws is left
   * out rather than breaking the form.
   */
  async findPageConfigs(formId: string): Promise<Record<string, Record<string, string>>> {
    const pageAppIds = this.appService
      .findAll()
      .filter(app => app.page)
      .map(app => app.id)

    if (!pageAppIds.length) {
      return {}
    }

    const integrations = await this.integrationModel.find({
      formId,
      appId: { $in: pageAppIds },
      status: IntegrationStatusEnum.ACTIVE
    })
    const result: Record<string, Record<string, string>> = {}

    for (const integration of integrations) {
      const app = this.appService.findById(integration.appId)

      if (!app?.page) {
        continue
      }

      try {
        result[app.id] = app.page(mapToObject(integration.config))
      } catch (err: any) {
        this.logger.error(
          `Couldn't build the page config of integration ${integration.id}: ${err?.message}`
        )
      }
    }

    return result
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
    await this.integrationRecordModel.deleteMany({ formId, appId })

    return (result.deletedCount ?? 0) > 0
  }

  async addRecord(record: IntegrationRecordInput): Promise<void> {
    await this.integrationRecordModel.create({
      ...record,
      willRetry: !!record.willRetry,
      error: shortenError(record.error)
    })
  }

  // --- Waiting for reconnection ------------------------------------------------

  /**
   * Keeps a submission that couldn't be delivered because the integration
   * needs reconnecting, so it's sent once the account is reconnected. Past
   * MAX_WAITING_RECORDS, the submission is recorded as failed instead.
   * Returns whether the submission is waiting.
   *
   * If the account was reconnected meanwhile, the reconnect may have resent
   * the waiting submissions before this one was recorded, so it's resent
   * straight away. A job holding its own submission skips that and resends
   * once it has failed (see IntegrationQueue.recordFailure).
   */
  async holdForReconnect(input: WaitingRecordInput, resendIfActive = true): Promise<boolean> {
    const { formId, appId, integrationId, submissionId } = input
    const attempt = input.attempt ?? 0
    const maxAttempts = Math.max(input.maxAttempts ?? 1, attempt)
    const waiting = await this.integrationRecordModel.countDocuments({
      integrationId,
      status: IntegrationRecordStatusEnum.WAITING,
      // One that's already waiting doesn't count against the cap
      submissionId: { $ne: submissionId }
    })

    if (waiting >= MAX_WAITING_RECORDS) {
      await this.addRecord({
        formId,
        appId,
        integrationId,
        submissionId,
        status: IntegrationRecordStatusEnum.FAILED,
        attempt,
        maxAttempts,
        error: `Not sent: ${MAX_WAITING_RECORDS} submissions are already waiting for the account to be reconnected`
      })
      return false
    }

    try {
      await this.integrationRecordModel.updateOne(
        { integrationId, submissionId, status: IntegrationRecordStatusEnum.WAITING },
        {
          $setOnInsert: {
            formId,
            appId,
            attempt,
            maxAttempts,
            willRetry: false,
            error: shortenError(input.error)
          }
        },
        { upsert: true }
      )
    } catch (err: any) {
      // Two concurrent upserts: the other one recorded it
      if (err?.code !== 11000) {
        throw err
      }
    }

    if (resendIfActive) {
      await this.resendIfActive(integrationId)
    }

    return true
  }

  async resendIfActive(integrationId: string): Promise<void> {
    const integration = await this.findById(integrationId)

    if (integration?.status === IntegrationStatusEnum.ACTIVE) {
      await this.resendWaiting(integration)
    }
  }

  async countWaiting(integrationId: string): Promise<number> {
    return this.integrationRecordModel.countDocuments({
      integrationId,
      status: IntegrationRecordStatusEnum.WAITING
    })
  }

  /**
   * Queues the integration's waiting submissions again, oldest first, and
   * removes their waiting records. Called whenever the integration becomes
   * active. Each record is claimed by one caller only, and a job that's still
   * queued for the submission isn't duplicated, so running this twice sends
   * each submission once. Never throws; returns how many were queued.
   */
  async resendWaiting(
    integration: Pick<IntegrationModel, 'id' | 'appId' | 'formId'>
  ): Promise<number> {
    const app = this.appService.findById(integration.appId)

    if (!app) {
      return 0
    }

    let resent = 0

    try {
      const waiting = await this.integrationRecordModel
        .find({ integrationId: integration.id, status: IntegrationRecordStatusEnum.WAITING })
        .sort({ createdAt: 1, _id: 1 })

      for (const record of waiting) {
        const claimed = await this.integrationRecordModel
          .findOneAndDelete({ _id: record._id, status: IntegrationRecordStatusEnum.WAITING })
          .lean()

        if (!claimed) {
          continue
        }

        try {
          await this.requeue(app, {
            appId: integration.appId,
            formId: integration.formId,
            integrationId: integration.id,
            submissionId: claimed.submissionId
          })
        } catch (err) {
          // Put it back unchanged (same id and date), so it keeps its place
          // and the next reconnect tries again
          await this.integrationRecordModel.collection.insertOne(claimed as any)
          throw err
        }

        resent++
      }
    } catch (err: any) {
      this.logger.error(
        `Couldn't resend waiting submissions of integration ${integration.id}: ${err?.message}`
      )
    }

    return resent
  }

  private async requeue(app: AppDefinition, data: IntegrationJobData): Promise<void> {
    const jobId = integrationJobId(data.integrationId, data.submissionId)
    const existing = await this.integrationQueue.getJob(jobId)

    if (existing) {
      let state = await existing.getState()

      // A job that's running while its submission waits is the one that put
      // it on hold and is about to fail; queue it again once it has
      if (state === 'active') {
        await Promise.race([
          existing.finished().catch(() => undefined),
          new Promise(resolve => setTimeout(resolve, RUNNING_JOB_WAIT).unref?.())
        ])
        state = await existing.getState()

        if (state === 'active') {
          throw new Error(`Job ${jobId} is still running`)
        }
      }

      // Still queued, so it will be delivered
      if (state !== 'failed' && state !== 'completed') {
        return
      }

      // Bull ignores add() while a job with the same id exists, and failed
      // jobs are kept
      await existing.remove()
    }

    await this.integrationQueue.add(data, { ...getAppJobOptions(app), jobId })
  }

  /**
   * The current integration's records, newest first. Scoped by integration id
   * so a job that finishes after its integration was deleted can't show up
   * under a new integration of the same app.
   */
  async findRecords(
    formId: string,
    appId: string,
    limit: number
  ): Promise<IntegrationRecordModel[]> {
    const integration = await this.findOne(formId, appId)

    if (!integration) {
      return []
    }

    return this.integrationRecordModel
      .find({ formId, appId, integrationId: integration.id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
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
      status: {
        $in: [IntegrationStatusEnum.ACTIVE, IntegrationStatusEnum.NEEDS_RECONNECT]
      }
    })

    for (const integration of integrations) {
      const app = this.appService.findById(integration.appId)

      // Apps that only run on the form page don't receive submissions
      if (!app?.run) {
        continue
      }

      const data: IntegrationJobData = {
        appId: integration.appId,
        formId: form.id,
        integrationId: integration.id,
        submissionId
      }

      if (integration.status === IntegrationStatusEnum.NEEDS_RECONNECT) {
        // Sent once the account is reconnected
        await this.holdForReconnect(data).catch(err =>
          this.logger.error(
            `Couldn't keep submission ${submissionId} for integration ${integration.id}: ${err?.message}`
          )
        )
        continue
      }

      this.integrationQueue.add(data, {
        ...getAppJobOptions(app),
        jobId: integrationJobId(integration.id, submissionId)
      })
    }
  }
}
