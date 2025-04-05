import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPE } from '@environments'
import { CdnService } from '@service'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
  destination?: string
  filename?: string
  path?: string
}

@Controller()
export class UploadController {
  constructor(private readonly cdnService: CdnService) {}

  @Post('/api/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      }
    })
  )
  async upload(@UploadedFile() file: MulterFile, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    if (!UPLOAD_FILE_TYPE.includes(file.mimetype)) {
      throw new BadRequestException('File type not supported')
    }

    const key = req.headers['x-cdn-key']
    const token = req.headers['x-cdn-token']

    if (!key || !token) {
      throw new BadRequestException('Invalid request')
    }

    // Validate token
    try {
      const payload = this.cdnService.verifyToken(token)

      if (!payload) {
        throw new BadRequestException('Invalid token')
      }
    } catch (error) {
      throw new BadRequestException('Invalid token')
    }

    try {
      await this.cdnService.upload(key, file.buffer)
      return { success: true }
    } catch (error) {
      throw new BadRequestException('Upload failed')
    }
  }
}
