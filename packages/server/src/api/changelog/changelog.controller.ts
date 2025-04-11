import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ChangelogService } from './changelog.service'

@Controller('/api')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get('/changelog/latest')
  @HttpCode(HttpStatus.OK)
  async getLatestRelease() {
    return this.changelogService.getLatestRelease()
  }

  @Get('/changelogs')
  @HttpCode(HttpStatus.OK)
  async changelogs() {
    return this.changelogService.getAllReleases()
  }
}
