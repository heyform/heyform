import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { date, nanoid } from '@heyform-inc/utils'

import { INVITE_CODE_EXPIRE_DAYS } from '@environments'
import { FormModel, TeamMemberModel, TeamModel } from '@model'

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamModel.name) private readonly teamModel: Model<TeamModel>,
    @InjectModel(TeamMemberModel.name)
    private readonly teamMemberModel: Model<TeamMemberModel>
  ) {}

  async findById(id: string): Promise<TeamModel | null> {
    return this.teamModel.findById(id)
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
    return !!result.ok
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.teamModel.deleteOne({
      _id: id
    })
    return result?.n > 0
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

  public async memberCount(teamId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.teamMemberModel.countDocuments(
        {
          teamId
        },
        (err, count) => {
          if (err) {
            reject(err)
          } else {
            resolve(count)
          }
        }
      )
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
    return !!result?.ok
  }

  public async deleteMember(teamId: string, memberId: string): Promise<boolean> {
    const result = await this.teamMemberModel.deleteOne({
      teamId,
      memberId
    })
    return result?.n > 0
  }

  public async deleteAllMemberInTeam(teamId: string): Promise<boolean> {
    const result = await this.teamMemberModel.deleteMany({
      teamId
    })
    return result?.n > 0
  }

  public async resetInviteCode(teamId: string): Promise<void> {
    await this.update(teamId, {
      inviteCode: nanoid(),
      inviteCodeExpireAt: date().add(INVITE_CODE_EXPIRE_DAYS, 'day').unix()
    })
  }
}
