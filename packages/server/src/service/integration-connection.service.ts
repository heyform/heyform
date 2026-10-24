import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IntegrationConnectionModel, IntegrationConnectionStatusEnum } from '@model'

/**
 * Storage for the OAuth2 accounts a team has connected. Token logic lives in
 * IntegrationAuthService.
 */
@Injectable()
export class IntegrationConnectionService {
  constructor(
    @InjectModel(IntegrationConnectionModel.name)
    private readonly connectionModel: Model<IntegrationConnectionModel>
  ) {}

  async findById(id: string): Promise<IntegrationConnectionModel | null> {
    return this.connectionModel.findById(id)
  }

  async findAccount(
    teamId: string,
    provider: string,
    accountId: string
  ): Promise<IntegrationConnectionModel | null> {
    return this.connectionModel.findOne({ teamId, provider, accountId })
  }

  async findAllInTeam(teamId: string, provider?: string): Promise<IntegrationConnectionModel[]> {
    return this.connectionModel
      .find({ teamId, ...(provider ? { provider } : {}) })
      .sort({ createdAt: 1 })
  }

  async create(connection: Partial<IntegrationConnectionModel>): Promise<string> {
    const result = await this.connectionModel.create(connection)
    return result.id
  }

  /**
   * Stores new tokens from connecting the account again, and makes the
   * connection active.
   */
  async reconnect(id: string, updates: Partial<IntegrationConnectionModel>): Promise<void> {
    await this.connectionModel.updateOne(
      { _id: id },
      {
        $set: { ...updates, status: IntegrationConnectionStatusEnum.ACTIVE },
        $unset: { statusReason: 1 },
        $inc: { tokenVersion: 1 }
      }
    )
  }

  /**
   * Stores refreshed tokens, unless they changed since `tokenVersion` was read
   * (another refresh or a reconnect won). Returns whether they were stored.
   */
  async updateTokens(
    id: string,
    tokenVersion: number,
    tokens: Record<string, any>
  ): Promise<boolean> {
    const result = await this.connectionModel.updateOne(
      { _id: id, tokenVersion },
      { $set: { tokens }, $inc: { tokenVersion: 1 } }
    )
    return result.modifiedCount > 0
  }

  /**
   * Marks the connection as needing reconnection, unless its tokens changed
   * since `tokenVersion` was read. Returns whether it was marked.
   */
  async markNeedsReconnect(id: string, tokenVersion: number, reason: string): Promise<boolean> {
    const result = await this.connectionModel.updateOne(
      { _id: id, tokenVersion },
      { $set: { status: IntegrationConnectionStatusEnum.NEEDS_RECONNECT, statusReason: reason } }
    )
    return result.modifiedCount > 0
  }

  // Whether a connection other than `exceptId` holds the same account
  async accountConnectedElsewhere(
    provider: string,
    accountId: string,
    exceptId: string
  ): Promise<boolean> {
    return !!(await this.connectionModel.exists({ provider, accountId, _id: { $ne: exceptId } }))
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.connectionModel.deleteOne({ _id: id })
    return (result.deletedCount ?? 0) > 0
  }
}
