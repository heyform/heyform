import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ThrottlerModule } from '@nestjs/throttler'
import { RedisModule } from '@svtslv/nestjs-ioredis'

import * as Controllers from './controller'
import { ModelModule } from './model/module'
import * as Resolvers from './resolver'
import { ScheduleModules, ScheduleProviders } from './schedule'
import * as Services from './service'
import { GraphqlService, MongoService, RedisService } from '@config'
import {
  AuthGuard,
  DeviceIdGuard,
  EndpointAnonymousIdGuard,
  GqlThrottlerGuard,
  PermissionGuard,
  RoleGuard
} from '@guard'
import { hs } from '@heyform-inc/utils'
import { FormBodyMiddleware, JsonBodyMiddleware, RawBodyMiddleware } from '@middleware'
import { GraphQLModule } from '@nestjs/graphql'
import { ScheduleModule } from '@nestjs/schedule'
import { LowerCaseScalar } from '@utils'

import { QueueModules, QueueProviders } from './queue'

@Module({
  imports: [...QueueModules, ...ScheduleModules, ScheduleModule.forRoot(), ModelModule],
  providers: [
    ...Object.values(QueueProviders),
    ...Object.values(ScheduleProviders),
    ...Object.values(Services)
  ],
  exports: [...Object.values(Services)]
})
class ServiceModule {}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: hs('1m'),
        limit: 1000
      }
    ]),
    ServiceModule
  ],
  controllers: [...Object.values(Controllers)],
  providers: [
    ...Object.values(Resolvers),
    AuthGuard,
    DeviceIdGuard,
    EndpointAnonymousIdGuard,
    GqlThrottlerGuard,
    PermissionGuard,
    RoleGuard,
    LowerCaseScalar
  ]
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
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
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
      // Stripe signs the exact bytes it sends, so webhooks need the unparsed body. Nest 10's
      // middleware matcher doesn't match `payment/(.*)`, which left req.body undefined.
      .apply(RawBodyMiddleware)
      .forRoutes({
        path: '/payment/*',
        method: RequestMethod.POST
      })
      .apply(FormBodyMiddleware)
      .forRoutes('{*path}')
      .apply(JsonBodyMiddleware)
      .forRoutes('{*path}')
  }
}
