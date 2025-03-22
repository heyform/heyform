import { AppType } from '@graphql'
import { AppModel } from '@model'
import { Query, Resolver } from '@nestjs/graphql'
import { AppService } from '@service'

@Resolver()
export class AppsResolver {
  constructor(private readonly appService: AppService) {}

  @Query(returns => [AppType])
  async apps(): Promise<AppModel[]> {
    return this.appService.findAll()
  }
}
