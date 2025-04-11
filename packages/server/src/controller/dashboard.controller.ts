import { Controller, Get, Header, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class DashboardController {
  // @Get('/*')
  @Get(['/', '/dashboard', '/dashboard/*'])
  @Header('X-Frame-Options', 'SAMEORIGIN')
  index(@Res() res: Response) {
    return res.render('index', {
      title: 'HeyForm Dashboard - Create and Manage Custom Forms Effortlessly',
      description:
        "Simplify your form creation process with HeyForm's intuitive dashboard. Design, customize, and manage forms all in one place, with no coding required."
    })
  }
}
