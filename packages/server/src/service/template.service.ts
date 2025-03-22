import { helper } from '@heyform-inc/utils'
import { TemplateModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(TemplateModel.name)
    private readonly templateModel: Model<TemplateModel>
  ) {}

  async findById(id: string): Promise<TemplateModel | null> {
    return this.templateModel.findById(id)
  }

  async findBySlug(slug: string): Promise<TemplateModel | null> {
    return this.templateModel.findOne({ slug })
  }

  async findAll(keyword?: string, limit?: number): Promise<TemplateModel[]> {
    const conditions: any = {
      published: true
    }

    if (keyword) {
      conditions.name = new RegExp(keyword, 'i')
    }

    if (helper.isValid(limit) && limit! > 0) {
      return this.templateModel
        .find(conditions)
        .sort({
          usedCount: -1
        })
        .limit(limit!)
    }

    return this.templateModel.find(conditions).sort({
      _id: -1
    })
  }

  public async updateUsedCount(templateId: string): Promise<any> {
    return this.templateModel.updateOne(
      {
        _id: templateId
      },
      {
        $inc: {
          usedCount: 1
        }
      }
    )
  }
}
