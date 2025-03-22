import { CustomDomainVerificationDto } from '@dto'
import { CADDY_API_KEY } from '@environments'
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res
} from '@nestjs/common'
import { CustomDomainService } from '@service'
import { Response } from 'express'

@Controller()
export class CustomDomainVerificationController {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Get('/custom-domain-verification')
  async index(
    @Query() query: CustomDomainVerificationDto,
    @Res() res: Response
  ) {
    if (query.key !== CADDY_API_KEY) {
      throw new BadRequestException('Invalid params')
    }

    const result = await this.customDomainService.findByDomain(query.domain)

    if (!result) {
      throw new BadRequestException('Invalid params')
    }

    const isVerified = await this.customDomainService.validate(query.domain)

    if (!isVerified) {
      throw new BadRequestException('Invalid params')
    }

    res.status(200).end()
  }
}
