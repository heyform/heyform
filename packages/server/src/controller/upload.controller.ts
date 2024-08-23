import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname } from 'path'

import { APP_HOMEPAGE_URL, S3_PUBLIC_URL, UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPES } from '@environments'
import { getMulterStorage } from '@config'
import { helper } from '@heyform-inc/utils'

@Controller()
export class UploadController {
  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (UPLOAD_FILE_TYPES.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException(`Unsupported file type ${extname(file.originalname)}`), false)
        }
      },
      storage: getMulterStorage()
    })
  )
  async index(@UploadedFile() file: any): Promise<{ filename: string; url: string; size: number }> {
    let url: string =
      APP_HOMEPAGE_URL.replace(/\/+$/, '') + `/static/upload/${encodeURIComponent(file.filename)}`

    if (file.location) {
      if (helper.isValid(S3_PUBLIC_URL)) {
        url = `${S3_PUBLIC_URL.replace(/\/+$/, '')}/${file.key}`
      } else {
        url = file.location
      }
    }

    return {
      filename: file.originalname,
      size: file.size,
      url
    }
  }
}
