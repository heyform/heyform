import { INVITE_CODE_EXPIRE_DAYS } from '@environments'
import { date, hs, nanoid, timestamp } from '@heyform-inc/utils'
import {
  FormModel,
  // PlanGradeEnum,
  SubscriptionStatusEnum,
  TeamInvitationModel,
  TeamMemberModel,
  TeamModel
} from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
// import { PlanService } from './plan.service'

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamModel.name) private readonly teamModel: Model<TeamModel>,
    @InjectModel(TeamMemberModel.name)
    private readonly teamMemberModel: Model<TeamMemberModel>,
    @InjectModel(TeamInvitationModel.name)
    private readonly teamInvitationModel: Model<TeamInvitationModel> // private readonly planService: PlanService
  ) {}

  async findById(id: string): Promise<TeamModel | null> {
    return this.teamModel.findById(id)
  }

  async findBySubscriptionId(
    subscriptionId: string
  ): Promise<TeamModel | null> {
    return this.teamModel.findOne({
      'subscription.id': subscriptionId
    })
  }

  async findAllBy(conditions: Record<string, any>): Promise<TeamModel[]> {
    return this.teamModel.find(conditions)
  }

  async findWithPlanById(id: string): Promise<TeamModel | null> {
    const team = await this.findById(id)

    if (!team) {
      return null
    }

    // team.plan = await this.planService.findById(team.subscription.planId)

    // Replace with Free Plan if the team's subscription is expired or with a pending payment
    // if (team.subscription.status !== SubscriptionStatusEnum.ACTIVE) {
    //   team.plan = await this.planService.findByGrade(PlanGradeEnum.FREE)
    // }

    return team
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

  async _internalFindAll(planIds: string[]) {
    return this.teamModel.find({
      'subscription.planId': {
        $in: planIds
      },
      'subscription.status': SubscriptionStatusEnum.ACTIVE,
      'subscription.trialing': false,
      'subscription.endAt': {
        $gt: timestamp()
      }
    })
  }

  async _internalFindAll2(planIds: string[]) {
    return this.teamModel.find({
      'subscription.planId': {
        $in: planIds
      },
      'subscription.status': SubscriptionStatusEnum.ACTIVE,
      'subscription.endAt': {
        $gt: timestamp()
      }
    })
  }

  public async create(team: TeamModel | any): Promise<string> {
    const result = await this.teamModel.create(team)
    return result.id
  }

  public async update(
    id: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.teamModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return !!result.ok
  }

  public async updateAll(
    ids: string[],
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.teamModel.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      updates
    )
    return result.n > 0
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.teamModel.deleteOne({
      _id: id
    })
    return result?.n > 0
  }

  public async findMemberById(
    teamId: string,
    memberId: string
  ): Promise<TeamMemberModel | null> {
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

  public async updateMember(
    teamId: string,
    memberId: string,
    updates: any
  ): Promise<any> {
    const result = await this.teamMemberModel.updateOne(
      {
        teamId,
        memberId
      },
      updates
    )
    return !!result?.ok
  }

  public async deleteMember(
    teamId: string,
    memberId: string
  ): Promise<boolean> {
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

  async findInvitations(
    teamId: string,
    emails?: string[]
  ): Promise<TeamInvitationModel[]> {
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

  async findInvitationById(
    invitationId: string
  ): Promise<TeamInvitationModel | null> {
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

  /**
   * 重置team邀请Code及时间
   * @param teamId 团队Id
   */
  public async resetInviteCode(teamId: string): Promise<void> {
    await this.update(teamId, {
      inviteCode: nanoid(),
      inviteCodeExpireAt: date().add(INVITE_CODE_EXPIRE_DAYS, 'day').unix()
    })
  }

  // Discard at Dec 20, 2021 (v2021.12.3)
  // /**
  //  * 重置 team submission 使用量
  //  * @param teamId 团队Id
  //  */
  // public async resetSubmissionQuota(teamId: string): Promise<void> {
  //   await this.update(teamId, {
  //     submissionQuota: 0,
  //     submissionResetAt: date().add(SUBMISSION_QUOTE_RESET_DAYS, 'day').unix()
  //   })
  // }

  // Discard at May 5, 2022
  // /**
  //  * Create a team for every new user
  //  * Attached Free plan to newly created team
  //  */
  // async createByNewUser(userId: string, userName: string): Promise<string> {
  //   const freePlan = await this.planService.findByGrade(PlanGradeEnum.FREE)
  //   const teamId = await this.create({
  //     ownerId: userId,
  //     name: `${userName}'s workspace`,
  //     storageQuota: 0,
  //     subscription: {
  //       planId: freePlan.id,
  //       billingCycle: BillingCycleEnum.FOREVER,
  //       startAt: timestamp(),
  //       endAt: -1,
  //       status: SubscriptionStatusEnum.ACTIVE
  //     }
  //   })
  //
  //   await this.createMember({
  //     teamId,
  //     memberId: userId,
  //     role: TeamRoleEnum.ADMIN
  //   })
  //
  //   return teamId
  // }
}
