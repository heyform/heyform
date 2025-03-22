import { helper } from '@heyform-inc/utils'
import { ContactModel, FormModel } from '@model'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactModel.name)
    private readonly contactModel: Model<ContactModel>
  ) {}

  async create(contact: ContactModel | any): Promise<string | null> {
    const result = await this.contactModel.create(contact)
    return result.id
  }

  async insertMany(contacts: ContactModel[] | any): Promise<any> {
    return this.contactModel.insertMany(contacts)
  }

  async findByTeamAndEmail(
    teamId: string,
    email: string
  ): Promise<ContactModel | null> {
    return this.contactModel.findOne({
      teamId,
      email
    })
  }

  async findAll(
    teamId: string,
    groupIds: string[],
    keyword: string,
    page = 1,
    limit = 30
  ): Promise<ContactModel[]> {
    const condition: any = {
      teamId
    }

    if (helper.isValid(keyword)) {
      const regx = new RegExp(keyword, 'i')

      condition.$or = [
        { fullName: { $regex: regx } },
        { email: { $regex: regx } },
        { jobTitle: { $regex: regx } },
        { phoneNumber: { $regex: regx } }
      ]
    }

    if (helper.isValidArray(groupIds)) {
      condition.groups = { $in: groupIds }
    }

    return this.contactModel
      .find(condition)
      .populate('groups')
      .sort({
        createdAt: -1
      })
      .skip((page - 1) * limit)
      .limit(limit)
  }

  async findByIdsInTeam(
    teamId: string,
    contactIds: string[]
  ): Promise<ContactModel[]> {
    return this.contactModel.find({
      _id: {
        $in: contactIds
      },
      teamId
    })
  }

  async count(
    teamId: string,
    keyword?: string,
    groupIds?: string[]
  ): Promise<number> {
    const condition: any = {
      teamId
    }

    if (helper.isValid(keyword)) {
      const regx = new RegExp(keyword, 'i')

      condition.$or = [
        { fullName: { $regex: regx } },
        { email: { $regex: regx } },
        { jobTitle: { $regex: regx } },
        { phoneNumber: { $regex: regx } }
      ]
    }

    if (helper.isValidArray(groupIds)) {
      condition.groups = { $in: groupIds }
    }

    return this.contactModel.countDocuments(condition)
  }

  public async countInGroups(teamId: string): Promise<any> {
    return this.contactModel
      .aggregate<FormModel>([
        { $match: { teamId } },
        { $project: { _id: 0, groups: 1 } },
        { $unwind: '$groups' },
        { $group: { _id: `$groups`, count: { $sum: 1 } } }
      ])
      .exec()
  }

  public async countInTeams(teamIds: string[]): Promise<any> {
    return this.contactModel
      .aggregate<FormModel>([
        { $match: { teamId: { $in: teamIds } } },
        { $group: { _id: `$teamId`, count: { $sum: 1 } } }
      ])
      .exec()
  }

  public async update(
    teamId: string,
    contactId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.contactModel.updateOne(
      {
        teamId,
        _id: contactId
      },
      updates
    )
    return !!result?.ok
  }

  public async updateMany(
    teamId: string,
    contactIds: string[],
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.contactModel.updateMany(
      {
        teamId,
        _id: {
          $in: contactIds
        }
      },
      updates
    )
    return !!result?.ok
  }

  public async deleteByIds(
    teamId: string,
    contactIds: string[]
  ): Promise<boolean> {
    const result = await this.contactModel.deleteMany({
      teamId,
      _id: {
        $in: contactIds
      }
    })
    return result?.n > 0
  }

  // Check contact quota
  async checkQuota(
    teamId: string,
    contactLimit: number,
    increaseCount = 1
  ): Promise<Boolean> {
    if (contactLimit < 1) {
      throw new BadRequestException({
        code: 'UPGRADE_PLAN',
        message: 'Upgrade the plan of your workspace to add contacts'
      })
    }

    const count = await this.count(teamId)

    if (contactLimit !== -1 && count + increaseCount > contactLimit) {
      throw new BadRequestException({
        code: 'CONTACT_QUOTA_EXCEED',
        message:
          'The contact quota exceeds, new contacts are no longer accepted'
      })
    }

    return true
  }
}
