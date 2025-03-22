import { CdnCallbackDto } from '@dto'
import { helper } from '@heyform-inc/utils'
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { TeamService } from '@service'
import { Response } from 'express'

@Controller()
export class CallbackController {
  constructor(private readonly teamService: TeamService) {}

  @Post('/cdn/callback')
  async index(@Body() input: CdnCallbackDto, @Res() res: Response) {
    const data = JSON.parse(input.endUser)
    let success = true

    if (helper.isValid(data.teamId)) {
      success = await this.teamService.update(data.teamId, {
        $inc: {
          storageQuota: input.size
        }
      })
    }

    const statusCode = success ? HttpStatus.OK : HttpStatus.BAD_REQUEST
    res.status(statusCode).send()
  }
}
