import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { mkdirpSync, pathExistsSync } from 'fs-extra'
import { diskStorage } from 'multer'
import { extname } from 'path'

import { nanoid } from '@heyform-inc/utils'

import { APP_HOMEPAGE_URL, UPLOAD_DIR, UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPES } from '@environments'

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
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const uploadPath = UPLOAD_DIR

          if (!pathExistsSync(uploadPath)) {
            mkdirpSync(uploadPath)
          }

          cb(null, uploadPath)
        },
        filename: (req: any, file: any, cb: any) => {
          cb(null, `${nanoid(12)}${extname(file.originalname)}`)
        }
      })
    })
  )
  async index(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    return {
      url: APP_HOMEPAGE_URL.replace(/\/+$/, '') + `/static/upload/${file.filename}`
    }
  }
}
