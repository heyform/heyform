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

  // Serve uploaded files - used by the community version
  app.use(
    '/static/upload',
    serveStatic(join(process.cwd(), 'uploads'), {
      maxAge: '30d',
      extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif']
    })
  )

  // Middleware is no longer needed as we'll be using absolute URLs for avatars
  // This code is kept but commented out for reference
  /*
  app.use((req, res, next) => {
    // Check if URL looks like a profile avatar path from DB (starts with slash, then has segments)
    if (req.path && req.path.match(/^\/[A-Za-z0-9]{8}\/[A-Za-z0-9]{24}\//)) {
      // Extract the filename (last segment)
      const segments = req.path.split('/');
      const filename = segments[segments.length - 1];

      // Redirect to the actual file in uploads directory
      return res.redirect(`/static/upload/${filename}`);
    }
    next();
  });
  */

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
