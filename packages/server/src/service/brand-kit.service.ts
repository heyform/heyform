import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { BrandKitModel } from '@model'
import { Model } from 'mongoose'

@Injectable()
export class BrandKitService {
  constructor(
    @InjectModel(BrandKitModel.name)
    private readonly brandKitModel: Model<BrandKitModel>
  ) {}

  public async findByTeamId(teamId: string) {
    return this.brandKitModel.findOne({
      teamId
    })
  }

  public async findAllInTeams(teamIds: string[]) {
    return this.brandKitModel.find({
      teamId: {
        $in: teamIds
      }
    })
  }

  public async create(brandKit: BrandKitModel | any): Promise<string> {
    const result = await this.brandKitModel.create(brandKit)
    return result.id
  }

  public async update(
    teamId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.brandKitModel.updateOne(
      {
        teamId
      },
      updates
    )
    return !!result?.ok
  }
}
