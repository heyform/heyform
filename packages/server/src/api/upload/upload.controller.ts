import {
  BadRequestException,
  Controller,
  Get,
  // Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname, join } from 'path'
import { Response } from 'express'
import * as fs from 'fs'
import * as sharp from 'sharp'

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

  // New endpoint to handle avatar requests with the DB path format
  @Get('/api/avatar/*')
  async getAvatar(
    @Req() req: any,
    @Res() res: Response,
    @Query('w') width?: string,
    @Query('h') height?: string
  ) {
    // Get the path after /api/avatar/
    const avatarPath = req.url.split('?')[0].replace('/api/avatar/', '')

    if (!avatarPath) {
      throw new BadRequestException('Missing avatar path')
    }

    try {
      // Try to find the file in the uploads directory
      const uploadsDir = join(process.cwd(), 'uploads')
      const metadataDir = join(uploadsDir, 'metadata')

      if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory does not exist:', uploadsDir)
        throw new BadRequestException('Uploads directory not found')
      }

      // const files = fs.readdirSync(uploadsDir).filter(file => !file.startsWith('.') && file !== 'metadata');

      // First, check metadata for matching DB path
      if (fs.existsSync(metadataDir)) {
        const metadataFiles = fs.readdirSync(metadataDir)

        for (const metaFile of metadataFiles) {
          try {
            const metadataPath = join(metadataDir, metaFile)
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

            // Check if this metadata entry matches our path
            const avatarPathWithSlash = avatarPath.startsWith('/')
              ? avatarPath
              : `/${avatarPath}`
            if (metadata.dbPath === avatarPathWithSlash) {
              // We found the matching file!
              const filePath = join(uploadsDir, metadata.filename)

              // Check if resizing is requested
              if (
                (width && parseInt(width) > 0) ||
                (height && parseInt(height) > 0)
              ) {
                // Get the image type from the file extension
                const ext = extname(metadata.filename).toLowerCase()
                const contentType =
                  ext === '.png'
                    ? 'image/png'
                    : ext === '.jpg' || ext === '.jpeg'
                    ? 'image/jpeg'
                    : ext === '.gif'
                    ? 'image/gif'
                    : ext === '.webp'
                    ? 'image/webp'
                    : 'image/jpeg' // Default to jpeg

                // Set the response headers
                res.set('Content-Type', contentType)

                // Stream and resize the image
                if (fs.existsSync(filePath)) {
                  const resizeOptions = {
                    width: width ? parseInt(width) : undefined,
                    height: height ? parseInt(height) : undefined
                  }

                  const transformer = sharp(filePath).resize(resizeOptions)

                  // Use appropriate format based on input
                  if (ext === '.png') {
                    transformer.png()
                  } else if (ext === '.webp') {
                    transformer.webp()
                  } else if (ext === '.gif') {
                    transformer.gif()
                  } else {
                    transformer.jpeg()
                  }

                  // Send the resized image
                  return transformer.pipe(res)
                } else {
                  throw new BadRequestException('Avatar file not found')
                }
              } else {
                // No resizing requested, just redirect to the static file
                const homepage = APP_HOMEPAGE || 'http://localhost:3000'
                const url = `${homepage.replace(
                  /\/+$/,
                  ''
                )}/static/upload/${encodeURIComponent(metadata.filename)}`
                return res.redirect(url)
              }
            }
          } catch (error) {
            // Skip invalid metadata files
            console.warn(`Error reading metadata file ${metaFile}:`, error)
          }
        }
      }

      // If no match found, return 404
      throw new BadRequestException('Avatar file not found')
    } catch (error) {
      console.error('Error serving avatar:', error)
      throw new BadRequestException('Failed to serve avatar')
    }
  }
}
