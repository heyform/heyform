import { Injectable, NestMiddleware } from '@nestjs/common'
import * as bodyParser from 'body-parser'
import { Request, Response } from 'express'

@Injectable()
export class FormBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => any) {
    bodyParser.urlencoded({
      limit: '1mb',
      extended: true
    })(req, res, next)
  }
}
