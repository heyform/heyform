import { FailedTaskModel, FailedTaskStatusEnum } from '@model'
import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bull'
import { Model } from 'mongoose'

@Injectable()
export class FailedTaskService {
  constructor(
    @InjectQueue('MailQueue') private readonly mailQueue: Queue,
    @InjectModel(FailedTaskModel.name)
    private readonly failedTaskModel: Model<FailedTaskModel>
  ) {}

  public async create(
    task: FailedTaskModel | any
  ): Promise<string | undefined> {
    const result = await this.failedTaskModel.create(task)
    return result.id
  }

  async discard(id: string, failedReason?: string): Promise<any> {
    return this.failedTaskModel.updateOne(
      {
        _id: id
      },
      {
        failedReason,
        status: FailedTaskStatusEnum.DISCARD
      }
    )
  }

  async resumeTasks(): Promise<number> {
    const tasks = await this.failedTaskModel.find({
      status: FailedTaskStatusEnum.PENDING
    })

    if (tasks.length > 0) {
      await this.failedTaskModel.updateMany(
        {
          _id: {
            $in: tasks.map(task => task.id)
          }
        },
        {
          status: FailedTaskStatusEnum.REQUEUE
        }
      )

      tasks.forEach(task => {
        const job = {
          ...task.data,
          failedTaskId: task.id
        }
        const options = {
          jobId: task.id
        }

        switch (task.data.queueName) {
          case 'MailQueue':
            this.mailQueue.add(job, options)
            break
        }
      })
    }

    return tasks.length
  }
}
