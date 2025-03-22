import {
  APP_LISTEN_HOSTNAME,
  APP_LISTEN_PORT,
  SENTRY_IO_DSN
} from '@environments'
import { ms } from '@heyform-inc/utils'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as Sentry from '@sentry/node'
import { hbs } from '@utils'
import * as cookieParser from 'cookie-parser'
import * as rateLimit from 'express-rate-limit'
import * as helmet from 'helmet'
import { join } from 'path'
import * as serveStatic from 'serve-static'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filter'

async function bootstrap() {
  // Sentry
  Sentry.init({
    dsn: SENTRY_IO_DSN
  })

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false
  })

  // Verify all params
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false
    })
  )

  // Catch all exceptions
  app.useGlobalFilters(new AllExceptionsFilter())

  // Enable cors
  app.enableCors({
    origin: true,
    credentials: true
  })

  // see https://github.com/nestjs/nest/issues/1788#issuecomment-474766198
  app.disable('x-powered-by')

  // Enable cookie
  app.use(cookieParser())

  // see https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', 1)

  // Static assets
  app.use(
    '/static',
    serveStatic(join(__dirname, '..', 'static'), {
      maxAge: '30d',
      extensions: ['png', 'svg', 'js', 'css']
    })
  )

  // Template rendering
  app.engine('html', hbs.__express)
  app.setBaseViewsDir(join(__dirname, '..', 'view'))
  app.setViewEngine('html')

  /**
   * Limit the number of user's requests
   * 1000 requests pre minute
   */
  app.use(
    rateLimit({
      headers: false,
      windowMs: ms('1m'),
      max: 1000
    })
  )

  // Security
  app.use(
    helmet({
      // see https://github.com/helmetjs/helmet#reference
      frameguard: false,
      contentSecurityPolicy: false,
      dnsPrefetchControl: false,
      referrerPolicy: false
    })
  )

  await app.listen(APP_LISTEN_PORT, APP_LISTEN_HOSTNAME)
}

bootstrap()
