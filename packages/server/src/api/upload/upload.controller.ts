import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname } from 'path'

import { APP_HOMEPAGE, UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPE } from '@environments'
import { getMulterStorage } from '@config'

@Controller()
export class UploadController {
  @Post('/api/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (UPLOAD_FILE_TYPE.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type ${extname(file.originalname)}`
            ),
            false
          )
        }
      },
      storage: getMulterStorage()
    })
  )
  async index(
    @UploadedFile() file: any
  ): Promise<{ filename: string; url: string; size: number }> {
    // Default homepage to localhost if APP_HOMEPAGE is not defined
    const homepage = APP_HOMEPAGE || 'http://localhost:3000'
    let url = `${homepage.replace(
      /\/+$/,
      ''
    )}/static/upload/${encodeURIComponent(file.filename || '')}`

    // Use file.location if available (typically from S3 or other storage service)
    if (file && file.location) {
      url = file.location
    }

    return {
      filename: file.originalname || 'unknown',
      size: file?.size || 0,
      url
    }
  }
}
