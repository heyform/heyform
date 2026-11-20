import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { extname } from 'path'
import serveStatic from 'serve-static'

import { corsOrigin, getUploadContentDisposition, sanitizeUploadFilename } from '@config'
import {
  APP_LISTEN_HOSTNAME,
  APP_LISTEN_PORT,
  STATIC_DIR,
  TRUST_PROXY,
  UPLOAD_DIR,
  VIEW_DIR
} from '@environments'
import { helper, ms } from '@heyform-inc/utils'
import { Logger, hbs } from '@utils'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false
  })

  // Apollo Server 4 expects req.body to be populated before the GraphQL middleware runs.
  app.use('/graphql', bodyParser.json({ limit: '1mb' }))

  // REST controllers require JSON parsing before Nest resolves @Body().
  app.use('/api/v1', bodyParser.json({ limit: '1mb' }))
  app.use('/mcp', bodyParser.json({ limit: '1mb' }))

  // Verify all params
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false
    })
  )

  // Catch all exceptions
  app.useGlobalFilters(new AllExceptionsFilter())

  app.enableCors({
    origin: corsOrigin,
    credentials: true
  })

  // Enable cookie
  app.use(cookieParser())

  // see https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', TRUST_PROXY)

  // Static assets
  app.use('/static/upload', (req, res, next) => {
    if (['.svg', '.svgz'].includes(extname(req.path).toLowerCase())) {
      return res.status(403).end()
    }

    next()
  })

  app.use(
    '/static/upload',
    serveStatic(UPLOAD_DIR, {
      fallthrough: false,
      maxAge: '30d',
      extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
      setHeaders: res => {
        const { attname } = res.req.query
        const extension = extname(res.req.path).toLowerCase()
        const mimeType = ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.webp'].includes(extension)
          ? 'image/raster'
          : 'application/octet-stream'
        const filename = helper.isValid(attname)
          ? sanitizeUploadFilename(Array.isArray(attname) ? attname[0] : attname)
          : res.req.path

        res.setHeader('Content-Disposition', getUploadContentDisposition(filename, mimeType))
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
        res.setHeader('X-Content-Type-Options', 'nosniff')
      }
    })
  )

  app.use(
    '/static',
    serveStatic(STATIC_DIR, {
      maxAge: '30d',
      extensions: ['jpg', 'jpeg', 'bmp', 'webp', 'gif', 'png', 'svg', 'js', 'css'],
      setHeaders: res => {
        const { attname } = res.req.query

        if (helper.isValid(attname)) {
          const filename = Array.isArray(attname) ? attname[0] : attname

          res.setHeader(
            'Content-Disposition',
            getUploadContentDisposition(filename, 'application/octet-stream', true)
          )
          res.setHeader('X-Content-Type-Options', 'nosniff')
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
    '/api/upload',
    rateLimit({
      headers: false,
      windowMs: ms('1m'),
      max: 30
    })
  )

  app.use(
    '/api/image',
    rateLimit({
      headers: false,
      windowMs: ms('1m'),
      max: 120
    })
  )

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
