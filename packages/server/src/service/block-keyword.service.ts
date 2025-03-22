import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { BlockKeywordModel } from '@model'
import { Model } from 'mongoose'

@Injectable()
export class BlockKeywordService {
  constructor(
    @InjectModel(BlockKeywordModel.name)
    private readonly blockKeywordModel: Model<BlockKeywordModel>
  ) {}

  async findAll(): Promise<BlockKeywordModel[]> {
    return this.blockKeywordModel.find()
  }
}
