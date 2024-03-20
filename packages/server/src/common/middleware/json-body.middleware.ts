import { Injectable, NestMiddleware } from '@nestjs/common'
import * as bodyParser from 'body-parser'
import { Request, Response } from 'express'

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => any) {
    bodyParser.json({
      limit: '1mb'
    })(req, res, next)
  }
}
