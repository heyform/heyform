import { Controller, Get, Header, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller()
export class SignUpController {
  @Get('/sign-up')
  @Header('X-Frame-Options', 'SAMEORIGIN')
  index(@Res() res: Response) {
    return res.render('index', {
      title: 'Sign Up for HeyForm - Start Building Custom Forms Today',
      description:
        'Join HeyForm to easily create and manage online forms. Sign up now and unlock powerful features designed for seamless form creation and data collection.'
    })
  }
}
