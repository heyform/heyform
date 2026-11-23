import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { RedisService } from './redis.service'
import { INVITE_CODE_EXPIRE_DAYS } from '@environments'
import { date, hs, nanoid, timestamp } from '@heyform-inc/utils'
import {
  FormModel,
  TeamInvitationModel,
  TeamMemberModel,
  TeamModel,
  getTeamOwnerIds,
  isTeamOwner
} from '@model'

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamModel.name) private readonly teamModel: Model<TeamModel>,
    @InjectModel(TeamMemberModel.name)
    private readonly teamMemberModel: Model<TeamMemberModel>,
    @InjectModel(TeamInvitationModel.name)
    private readonly teamInvitationModel: Model<TeamInvitationModel>,
    private readonly redisService: RedisService
  ) {}

  async findById(id: string): Promise<TeamModel | null> {
    return this.teamModel.findById(id)
  }

  async findJoinableByInvite(teamId: string, inviteCode: string): Promise<TeamModel | null> {
    return this.teamModel.findOne({
      _id: teamId,
      inviteCode,
      allowJoinByInviteLink: true,
      inviteCodeExpireAt: {
        $gt: timestamp()
      }
    })
  }

  async findAllBy(conditions: Record<string, any>): Promise<TeamModel[]> {
    return this.teamModel.find(conditions)
  }

  async findAll(memberId: string): Promise<TeamModel[]> {
    const members = await this.teamMemberModel.find({
      memberId
    })

    return this.teamModel
      .find({
        _id: {
          $in: members.map(member => member.teamId)
        }
      })
      .sort({
        name: 1
      })
  }

  async findAllForAccountDeletion(memberId: string): Promise<TeamModel[]> {
    const teams = await this.findAll(memberId)
    // Find sole-owner workspaces even if a previous deletion removed their memberships.
    return this.teamModel.find({
      $or: [
        { _id: { $in: teams.map(team => team.id) } },
        { ownerId: memberId },
        { ownerIds: memberId }
      ]
    })
  }

  public async create(team: TeamModel | any): Promise<string> {
    const result = await this.teamModel.create(team)
    return result.id
  }

  public async update(id: string, updates: Record<string, any>): Promise<boolean> {
    const result = await this.teamModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return result.acknowledged
  }

  // Serializes ownership changes with member removal and workspace deletion.
  withMembershipLock<T>(teamId: string, callback: () => Promise<T>): Promise<T> {
    return this.redisService.withLock(`workspace-membership:${teamId}`, '30s', callback)
  }

  private async updateOwners(team: TeamModel, ownerIds: string[]): Promise<void> {
    if (ownerIds.length === 0) {
      throw new BadRequestException('The workspace must have at least one owner')
    }

    const result = await this.teamModel.updateOne(
      { _id: team.id, ownerId: team.ownerId, ownerIds: team.ownerIds ?? null },
      { $set: { ownerId: ownerIds[0], ownerIds } }
    )

    if (!result.matchedCount) {
      throw new ConflictException('Workspace ownership changed. Please try again.')
    }
  }

  async changeOwnership(
    teamId: string,
    actorId: string,
    memberId: string,
    action: 'grant' | 'revoke' | 'transfer'
  ): Promise<boolean> {
    return this.withMembershipLock(teamId, async () => {
      const team = await this.findById(teamId)
      if (!team || !isTeamOwner(team, actorId)) {
        throw new BadRequestException("You don't have permission to change workspace ownership")
      }
      if (!(await this.findMemberById(teamId, memberId))) {
        throw new BadRequestException('The workspace member does not exist')
      }

      const owners = getTeamOwnerIds(team)
      const targetIsOwner = owners.includes(memberId)
      let nextOwners: string[]

      switch (action) {
        case 'grant':
          if (targetIsOwner) return true
          nextOwners = [...owners, memberId]
          break
        case 'revoke':
          if (!targetIsOwner) return true
          nextOwners = owners.filter(id => id !== memberId)
          break
        case 'transfer':
          if (memberId === actorId) return true
          nextOwners = owners.flatMap(id =>
            id === actorId ? (targetIsOwner ? [] : [memberId]) : [id]
          )
          break
      }

      await this.updateOwners(team, nextOwners)
      return true
    })
  }

  public async updateAll(ids: string[], updates: Record<string, any>): Promise<boolean> {
    const result = await this.teamModel.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      updates
    )
    return result.matchedCount > 0
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.teamModel.deleteOne({
      _id: id
    })
    return (result.deletedCount ?? 0) > 0
  }

  public async findMemberById(teamId: string, memberId: string): Promise<TeamMemberModel | null> {
    return this.teamMemberModel.findOne({
      teamId,
      memberId
    })
  }

  public async findMembersInTeam(teamId: string): Promise<TeamMemberModel[]> {
    return this.teamMemberModel.find({
      teamId
    })
  }

  public async findMemberRelationInTeams(
    memberId: string,
    teamIds: string[]
  ): Promise<TeamMemberModel[]> {
    return this.teamMemberModel.find({
      teamId: {
        $in: teamIds
      },
      memberId
    })
  }

  public async memberCount(teamId: string): Promise<number> {
    return this.teamMemberModel.countDocuments({
      teamId
    })
  }

  public async membersInTeams(teamIds: string[]): Promise<any> {
    return this.teamMemberModel
      .find({
        teamId: {
          $in: teamIds
        }
      })
      .sort({
        _id: -1
      })
  }

  public async memberCountMaps(teamIds: string[]): Promise<any> {
    return this.teamMemberModel
      .aggregate<FormModel>([
        { $match: { teamId: { $in: teamIds } } },
        { $group: { _id: `$teamId`, count: { $sum: 1 } } }
      ])
      .exec()
  }

  public async createMember(member: TeamMemberModel | any): Promise<string> {
    const result = await this.teamMemberModel.create(member)
    return result.id
  }

  public async updateMember(teamId: string, memberId: string, updates: any): Promise<any> {
    const result = await this.teamMemberModel.updateOne(
      {
        teamId,
        memberId
      },
      updates
    )
    return result.acknowledged
  }

  async deleteMember(teamId: string, memberId: string, actorId = memberId): Promise<boolean> {
    return this.withMembershipLock(teamId, async () => {
      const team = await this.findById(teamId)
      if (!team || (actorId !== memberId && !isTeamOwner(team, actorId))) {
        throw new BadRequestException('This operation is not allowed in the workspace')
      }
      if (isTeamOwner(team, memberId)) {
        throw new BadRequestException('Cannot remove a workspace owner')
      }

      return this.deleteMemberRecord(teamId, memberId)
    })
  }

  async removeAccountFromTeam(
    teamId: string,
    memberId: string,
    dissolveTeam: () => Promise<void>
  ): Promise<void> {
    await this.withMembershipLock(teamId, async () => {
      const team = await this.findById(teamId)
      if (!team) return

      if (isTeamOwner(team, memberId)) {
        const remainingOwners = getTeamOwnerIds(team).filter(id => id !== memberId)
        if (remainingOwners.length === 0) {
          await dissolveTeam()
          return
        }
        await this.updateOwners(team, remainingOwners)
      }

      await this.deleteMemberRecord(teamId, memberId)
    })
  }

  private async deleteMemberRecord(teamId: string, memberId: string): Promise<boolean> {
    const result = await this.teamMemberModel.deleteOne({
      teamId,
      memberId
    })
    return (result.deletedCount ?? 0) > 0
  }

  public async deleteAllMemberInTeam(teamId: string): Promise<boolean> {
    const result = await this.teamMemberModel.deleteMany({
      teamId
    })
    return (result.deletedCount ?? 0) > 0
  }

  async findInvitations(teamId: string, emails?: string[]): Promise<TeamInvitationModel[]> {
    const conditions: Record<string, any> = {
      teamId
    }

    if (emails) {
      conditions.email = {
        $in: emails
      }
    }

    return this.teamInvitationModel.find(conditions)
  }

  async findInvitationById(invitationId: string): Promise<TeamInvitationModel | null> {
    return this.teamInvitationModel.findById(invitationId)
  }

  async createInvitations(teamId: string, emails: string[]): Promise<any> {
    const expireAt = timestamp() + hs('7d')

    return this.teamInvitationModel.insertMany(
      emails.map(email => ({
        teamId,
        email,
        expireAt
      }))
    )
  }

  public async deleteInvitation(invitationId: string): Promise<any> {
    return this.teamInvitationModel.deleteOne({
      _id: invitationId
    })
  }

  public async resetInviteCode(teamId: string): Promise<void> {
    await this.update(teamId, {
      inviteCode: nanoid(),
      inviteCodeExpireAt: date().add(INVITE_CODE_EXPIRE_DAYS, 'day').unix()
    })
  }
}
