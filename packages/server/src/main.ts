import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as cookieParser from 'cookie-parser'
import * as rateLimit from 'express-rate-limit'
import * as helmet from 'helmet'
import * as serveStatic from 'serve-static'

import { helper, ms } from '@heyform-inc/utils'

import { APP_LISTEN_HOSTNAME, APP_LISTEN_PORT, STATIC_DIR, VIEW_DIR } from '@environments'
import { Logger, hbs } from '@utils'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filter'

async function bootstrap() {
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

  // Enable cookie
  app.use(cookieParser())

  // see https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', 1)

  // Static assets
  app.use(
    '/static',
    serveStatic(STATIC_DIR, {
      maxAge: '30d',
      extensions: ['jpg', 'jpeg', 'bmp', 'webp', 'gif', 'png', 'svg', 'js', 'css'],
      setHeaders: (res, path) => {
        const { attname } = res.req.query

        if (helper.isValid(attname)) {
          res.setHeader('Content-Disposition', `attachment; filename="${attname}"`)
        }
      }
    })
  )

  // Template rendering
  app.engine('html', hbs.__express)
  app.setBaseViewsDir(VIEW_DIR)
  app.setViewEngine('html')

  /**
   * Limit the number of user's requests
   * 1000 requests per minute
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

  await app.listen(APP_LISTEN_PORT, APP_LISTEN_HOSTNAME, () => {
    Logger.info(
      `Server is running on http://${APP_LISTEN_HOSTNAME}:${APP_LISTEN_PORT}`,
      'NestApplication'
    )
  })
}

bootstrap()
