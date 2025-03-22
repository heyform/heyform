import { Controller, Get, Res } from '@nestjs/common'
import { AuthService } from '@service'

@Controller()
export class LogoutController {
  constructor(private readonly authService: AuthService) {}

  @Get('/logout')
  async index(@Res() res: any) {
    this.authService.removeSession(res)
    res.redirect(302, '/login')
  }
}
