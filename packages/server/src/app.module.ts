import { HttpModule, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { RedisModule } from '@svtslv/nestjs-ioredis'

import { GraphqlService, MongoService, RedisService } from '@config'
import { FormBodyMiddleware, JsonBodyMiddleware, RawBodyMiddleware } from '@middleware'
import { LowerCaseScalar } from '@utils'

import * as Controllers from './controller'
import { ModelModule } from './model/module'
import { QueueModules, QueueProviders } from './queue'
import * as Resolvers from './resolver'
import { ScheduleModules, ScheduleProviders } from './schedule'
import * as Services from './service'

@Module({
  imports: [...QueueModules, ...ScheduleModules, HttpModule, ScheduleModule.forRoot(), ModelModule],
  providers: [
    ...Object.values(QueueProviders),
    ...Object.values(ScheduleProviders),
    ...Object.values(Services)
  ],
  exports: [...Object.values(Services)]
})
class ServiceModule {}

@Module({
  imports: [ServiceModule],
  controllers: [...Object.values(Controllers)],
  providers: [...Object.values(Resolvers), LowerCaseScalar]
})
class ResolverModule {}

@Module({
  imports: [
    RedisModule.forRootAsync({
      useClass: RedisService
    }),
    MongooseModule.forRootAsync({
      useClass: MongoService
    }),
    GraphQLModule.forRootAsync({
      useClass: GraphqlService
    }),
    ServiceModule,
    ResolverModule
  ],
  providers: []
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({
        path: '/payment/*',
        method: RequestMethod.POST
      })
      .apply(FormBodyMiddleware)
      .forRoutes('*')
      .apply(JsonBodyMiddleware)
      .forRoutes('*')
  }
}
