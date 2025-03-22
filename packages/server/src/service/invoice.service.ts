import { InvoiceModel, InvoiceStatusEnum } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(InvoiceModel.name)
    private readonly invoiceModel: Model<InvoiceModel>
  ) {}

  async findById(id: string): Promise<InvoiceModel | null> {
    return this.invoiceModel.findById(id)
  }

  async findAllPaidInTeam(teamId: string): Promise<InvoiceModel[]> {
    return this.invoiceModel
      .find({
        teamId,
        status: InvoiceStatusEnum.PAID
      })
      .sort({
        paidAt: -1
      })
  }

  async findByTeamId(
    teamId: string,
    invoiceId: string
  ): Promise<InvoiceModel | null> {
    return this.invoiceModel.findOne({
      _id: invoiceId,
      teamId
    })
  }

  async discardUnpaid(teamId: string): Promise<boolean> {
    const result = await this.invoiceModel.updateMany(
      {
        teamId,
        status: InvoiceStatusEnum.UNPAID
      },
      {
        status: InvoiceStatusEnum.EXPIRED
      }
    )
    return result?.n > 0
  }

  async create(invoice: InvoiceModel | any): Promise<string> {
    const result = await this.invoiceModel.create(invoice)
    return result.id
  }

  public async update(
    invoiceId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.invoiceModel.updateOne(
      {
        _id: invoiceId
      },
      updates
    )
    return !!result?.ok
  }
}
