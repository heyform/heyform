import { Module } from '@nestjs/common'
import { ChangelogController } from './changelog/changelog.controller'
import { ChangelogService } from './changelog/changelog.service'
import { UploadModule } from './upload/upload.module'

@Module({
  imports: [UploadModule],
  controllers: [ChangelogController],
  providers: [ChangelogService],
  exports: [ChangelogService]
})
export class ApiModule {}
