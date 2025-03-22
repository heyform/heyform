import { helper } from '@heyform-inc/utils'
import { GroupModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(GroupModel.name)
    private readonly groupModel: Model<GroupModel>
  ) {}

  async create(group: GroupModel | any): Promise<string | null> {
    const result = await this.groupModel.create(group)
    return result.id
  }

  async count(teamId: string, keyword?: string): Promise<number> {
    const condition: any = {
      teamId
    }

    if (helper.isValid(keyword)) {
      condition.name = new RegExp(keyword, 'i')
    }

    return this.groupModel.countDocuments(condition)
  }

  async findAll(
    teamId: string,
    keyword: string,
    page = 1,
    limit = 30
  ): Promise<GroupModel[]> {
    const condition: any = {
      teamId
    }

    if (helper.isValid(keyword)) {
      condition.name = new RegExp(keyword, 'i')
    }

    const m = this.groupModel.find(condition).sort({
      createdAt: -1
    })

    if (limit > 0) {
      return m.skip((page - 1) * limit).limit(limit)
    }

    return m
  }

  public async update(
    teamId: string,
    contactId: string,
    name: string
  ): Promise<boolean> {
    const result = await this.groupModel.updateOne(
      {
        teamId,
        _id: contactId
      },
      {
        name
      }
    )
    return !!result?.ok
  }

  public async delete(teamId: string, groupId: string): Promise<boolean> {
    const result = await this.groupModel.deleteOne({
      teamId,
      _id: groupId
    })
    return result?.n > 0
  }
}
