/**
 * @program: servers
 * @description: 第三方需要 OAuth v2 授权登录的应用回调地址
 * @author: Mufeng
 * @date: 2021-06-11 12:28
 **/

import { Controller, Get, Query, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class ThirdPartyAuthorizeController {
  @Get('/connect/oauth2/callback')
  async index(@Query() query: Record<string, string>, @Res() res: Response) {
    return res.render('third-party-authorize', {
      rendererData: query
    })
  }
}
