import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class FormController {
  @Get('/form/*')
  index(@Res() res: Response) {
    return res.render('index', {
      rendererData: {}
    })
  }
}
