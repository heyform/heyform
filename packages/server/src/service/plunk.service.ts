import { Injectable } from '@nestjs/common'
import { PLUNK_API_KEY, PLUNK_API_URL } from '@environments'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import got from 'got'

import { PlunkQueueJob } from '../queue/plunk.queue'

@Injectable()
export class PlunkService {
  constructor(
    @InjectQueue('PlunkQueue')
    private readonly plunkQueue: Queue
  ) {}

  async createContact(email: string, data: Record<string, any>) {
    const { success, message } = await this.request('/contacts', {
      method: 'POST',
      json: {
        email,
        data,
        subscribed: true
      }
    })

    if (!success) {
      throw new Error(message)
    }
  }

  async trackEvent(email: string, event: string, data: Record<string, any>) {
    const { success, message } = await this.request('/track', {
      method: 'POST',
      json: {
        email,
        event,
        data
      }
    })

    if (!success) {
      throw new Error(message)
    }
  }

  addQueue(data: Omit<PlunkQueueJob, 'queueName' | 'failedTaskId'>) {
    this.plunkQueue.add(data)
  }

  private request(url: string, options?: any): Promise<any> {
    return got(PLUNK_API_URL + url, {
      ...options,
      headers: {
        Authorization: `Bearer ${PLUNK_API_KEY}`
      },
      timeout: 30_000
    }).json()
  }
}
