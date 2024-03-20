import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import * as rawBody from 'raw-body'

import { helper } from '@heyform-inc/utils'

export const HttpRawBody = createParamDecorator(
  async (_: any, ctx: ExecutionContext): Promise<string> => {
    const req = ctx.switchToHttp().getRequest()
    let payload: string

    if (req.readable) {
      const raw = await rawBody(req)
      payload = raw.toString('utf8').trim()
    } else if (helper.isPlainObject(req.body) || helper.isArray(req.body)) {
      payload = JSON.stringify(req.body, null, 2)
    } else {
      payload = req.body.toString()
    }

    return payload
  }
)
