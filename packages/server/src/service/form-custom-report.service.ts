import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FormCustomReportModel } from '@model'
import { Model } from 'mongoose'

@Injectable()
export class FormCustomReportService {
  constructor(
    @InjectModel(FormCustomReportModel.name)
    private readonly formCustomReportModel: Model<FormCustomReportModel>
  ) {}

  async findByFormId(formId: string): Promise<FormCustomReportModel | null> {
    return this.formCustomReportModel.findOne({
      formId
    })
  }

  public async create(report: FormCustomReportModel | any): Promise<string> {
    const result = await this.formCustomReportModel.create(report)
    return result.id
  }

  public async update(
    formId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.formCustomReportModel.updateOne(
      {
        formId
      },
      updates
    )
    return !!result?.ok
  }
}
