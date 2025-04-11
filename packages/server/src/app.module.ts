import { GraphqlService, MongoService, RedisService } from '@config'
import { LowerCaseScalar } from '@heyforms/nestjs'
import {
  FormBodyMiddleware,
  JsonBodyMiddleware,
  RawBodyMiddleware
} from '@middleware'
import {
  HttpException,
  HttpModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { GraphQLModule } from '@nestjs/graphql'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { RedisModule } from '@svtslv/nestjs-ioredis'
import { RavenInterceptor, RavenModule } from 'nest-raven'
import { ThrottlerModule } from '@nestjs/throttler'
import { hs } from '@heyform-inc/utils'
// @ts-ignore
import { SSEMiddleware } from 'nestjs-sse'
import * as Controllers from './controller'
import { ModelModule } from './model/module'
import { QueueModules, QueueProviders } from './queue'
import * as Resolvers from './resolver'
import { ScheduleModules, ScheduleProviders } from './schedule'
import * as Services from './service'
import { ApiModule } from './api/api.module'

@Module({
  imports: [
    ...QueueModules,
    ...ScheduleModules,
    HttpModule,
    ScheduleModule.forRoot(),
    ModelModule
  ],
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
    ThrottlerModule.forRoot({
      ttl: hs('1m'),
      limit: 1000
    }),
    ServiceModule,
    ApiModule
  ],
  controllers: [...Object.values(Controllers)],
  providers: [...Object.values(Resolvers), LowerCaseScalar]
})
class ResolverModule {}

@Module({
  imports: [
    RavenModule,
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
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        filters: [
          // Filter exceptions of type HttpException. Ignore those that
          // have status code of less than 500
          {
            type: HttpException,
            filter: (exception: HttpException) => 500 > exception.getStatus()
          }
        ]
      })
    }
  ]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(SSEMiddleware)
      .forRoutes({
        path: '/api/chat',
        method: RequestMethod.POST
      })
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
