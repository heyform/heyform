import { Injectable } from '@nestjs/common'

import * as apps from '../apps'
import { AppDefinition } from '../apps/types'

@Injectable()
export class AppService {
  private readonly apps: Record<string, AppDefinition> = apps

  findAll(): AppDefinition[] {
    return Object.values(this.apps)
  }

  findById(id: string): AppDefinition | undefined {
    // Own properties only, so ids like `constructor` don't resolve to Object members
    return Object.prototype.hasOwnProperty.call(this.apps, id) ? this.apps[id] : undefined
  }
}
