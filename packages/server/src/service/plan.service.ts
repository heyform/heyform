import { PlanGradeEnum, PlanModel, PlanPriceModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(PlanModel.name) private readonly planModel: Model<PlanModel>,
    @InjectModel(PlanPriceModel.name)
    private readonly planPriceModel: Model<PlanPriceModel>
  ) {}

  async findAllActive(): Promise<PlanModel[]> {
    const plans = await this.planModel
      .find({
        status: 1
      })
      .sort({
        grade: 1
      })
    const prices = await this.planPriceModel.find()

    return plans.map(plan => {
      plan.prices = prices.filter(row => row.planId === plan.id)
      return plan
    })
  }

  async findAll(): Promise<PlanModel[]> {
    const plans = await this.planModel.find()
    const prices = await this.planPriceModel.find()

    return plans.map(plan => {
      plan.prices = prices.filter(row => row.planId === plan.id)
      return plan
    })
  }

  async findById(planId: string): Promise<PlanModel> {
    const plan = await this.planModel.findById(planId)
    plan.prices = await this.planPriceModel.find({ planId })
    return plan
  }

  async findByGrade(grade: PlanGradeEnum): Promise<PlanModel> {
    return this.planModel.findOne({
      grade
    })
  }

  async findByActiveGrade(grade: PlanGradeEnum): Promise<PlanModel> {
    return this.planModel.findOne({
      grade,
      status: 1
    })
  }

  async findWithPricesByGrade(grade: PlanGradeEnum): Promise<PlanModel> {
    const plan = await this.planModel.findOne({
      grade
    })
    plan.prices = await this.planPriceModel.find({ planId: plan.id })
    return plan
  }

  async findByPriceId(priceId: string): Promise<PlanModel> {
    const price = await this.findPlanPriceById(priceId)

    if (price) {
      const plan = await this.planModel.findById(price.planId)
      plan.price = price
      return plan
    }
  }

  async findPlanPriceById(priceId: string): Promise<PlanPriceModel> {
    return this.planPriceModel.findById(priceId)
  }

  async findPlanPriceBy(
    conditions: Record<string, any>
  ): Promise<PlanPriceModel | undefined> {
    return this.planPriceModel.findOne(conditions)
  }

  async findPlanPricesBy(
    conditions: Record<string, any>
  ): Promise<PlanPriceModel[]> {
    return this.planPriceModel.find(conditions)
  }
}
