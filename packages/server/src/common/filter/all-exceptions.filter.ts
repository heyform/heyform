import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException
} from '@nestjs/common'
import { Logger } from '@utils'
import { GqlExecutionContext } from '@nestjs/graphql'
import { helper } from '@heyform-inc/utils'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: Error, host: ArgumentsHost): void {
    const gqlCtx = GqlExecutionContext.create(host as any)
    const ctx = gqlCtx.getContext()

    // Graphql request exception
    if (helper.isValid(ctx.res)) {
      if (!(exception instanceof HttpException)) {
        // Log the exception
        this.logger.error(exception, exception.stack)

        // Re-throw the exception
        throw new InternalServerErrorException(exception.message)
      }
    }

    // Http request exception
    else {
      const res = host.switchToHttp().getResponse()

      let httpException = exception as HttpException

      if (!(exception instanceof HttpException)) {
        httpException = new InternalServerErrorException(exception.message)

        // Log the exception
        this.logger.error(exception, exception.stack)
      }

      if (res.get('content-type') === 'text/event-stream') {
        const response = httpException.getResponse()
        let message = response as string

        if (helper.isObject(response)) {
          message = (response as any).message[0]
        }

        res.sse(`data: [ERROR] ${message}\n\n`)
        return res.end()
      }

      res.status(httpException.getStatus()).json(httpException.getResponse())
    }
  }
}
