import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname, join } from 'path'
import { Response } from 'express'
import * as fs from 'fs'
// import { nanoid } from '@heyform-inc/utils'

import {
  APP_HOMEPAGE,
  APP_LISTEN_HOSTNAME,
  APP_LISTEN_PORT,
  UPLOAD_FILE_SIZE,
  UPLOAD_FILE_TYPE
} from '@environments'
import { getMulterStorage } from '@config'
import { helper } from '@heyform-inc/utils'

// For compatibility with the original code
// const APP_HOMEPAGE_URL = process.env.APP_HOMEPAGE_URL || APP_HOMEPAGE
const UPLOAD_FILE_TYPES = UPLOAD_FILE_TYPE
const S3_PUBLIC_URL = '' // Set to empty as we're not using S3 in community version

/**
 * Construct a valid base URL for file uploads
 */
function getBaseUrl(): string {
  // First try to use APP_HOMEPAGE_URL which is explicitly set in .env
  if (helper.isValid(process.env.APP_HOMEPAGE_URL)) {
    return process.env.APP_HOMEPAGE_URL
  }

  // Then try APP_HOMEPAGE which is also set in .env
  if (helper.isValid(APP_HOMEPAGE)) {
    return APP_HOMEPAGE
  }

  // Finally, construct from hostname and port
  const hostname = APP_LISTEN_HOSTNAME || 'localhost'
  const port = APP_LISTEN_PORT || 3000
  return `http://${hostname}:${port}`
}

@Controller()
export class UploadController {
  // Original API endpoint - keep this to avoid conflicts
  @Post('/api/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (UPLOAD_FILE_TYPES.includes(file.mimetype)) {
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
  async apiUpload(
    @UploadedFile() file: any
  ): Promise<{ filename: string; url: string; size: number }> {
    // Build URL based on environment configuration
    const baseUrl = getBaseUrl()
    let url = `${baseUrl.replace(
      /\/+$/,
      ''
    )}/static/upload/${encodeURIComponent(file.filename || '')}`

    // Use file.location if available (typically from S3 or other storage service)
    if (file && file.location) {
      if (helper.isValid(S3_PUBLIC_URL)) {
        url = `${S3_PUBLIC_URL.replace(/\/+$/, '')}/${file.key}`
      } else {
        url = file.location
      }
    }

    return {
      filename: file.originalname || 'unknown',
      size: file?.size || 0,
      url
    }
  }

  // Standard upload endpoint for direct file uploads - matching original implementation
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
    const baseUrl = getBaseUrl()
    let url = `${baseUrl.replace(
      /\/+$/,
      ''
    )}/static/upload/${encodeURIComponent(file.filename)}`

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

  // Special endpoint for user avatar uploads that returns paths in the expected format
  @Post('/api/avatar-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (UPLOAD_FILE_TYPES.includes(file.mimetype)) {
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
  async avatarUpload(
    @UploadedFile() file: any,
    @Req() req: any
  ): Promise<{ url: string; dbPath: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    // Extract the user ID from the request, if available
    const userId = req.body.userId || req.query.userId || 'unknown'

    // Generate a random 8-character prefix (similar to what we see in the DB path)
    const randomPrefix = Math.random().toString(36).substring(2, 10)

    // Create the special path format used in the database
    const dbPath = `/${randomPrefix}/${userId}/${file.filename}`

    // Create a URL for the uploaded file - this is for actual file access
    const baseUrl = getBaseUrl()
    const fileUrl = `${baseUrl.replace(/\/+$/, '')}/static/upload/${
      file.filename
    }`

    // In the community version, we'll return both the real URL for accessing the file
    // and the special path format that the database expects
    return {
      url: fileUrl, // The real URL to access the file (with http://)
      dbPath // The path to store in the database (without http://)
    }
  }

  // Compatible endpoint for token-based uploads from the frontend
  @Post('/api/cdn-upload') // Changed to /api/cdn-upload to avoid conflicts
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (UPLOAD_FILE_TYPES.includes(file.mimetype)) {
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
  async cdnUpload(
    @UploadedFile() file: any,
    @Req() req: any,
    @Res() res: Response
  ): Promise<void> {
    // Extract key from request (used by the frontend)
    const key = req.body.key

    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    if (!key) {
      throw new BadRequestException('No key provided')
    }

    console.log('CDN Upload request - key:', key)
    console.log('CDN Upload file:', file.filename)

    // Create a URL for the uploaded file using configured hostname
    const baseUrl = getBaseUrl()
    const fileUrl = `${baseUrl.replace(/\/+$/, '')}/static/upload/${
      file.filename
    }`

    console.log('Generated file URL:', fileUrl)

    // Store a mapping from the key to the actual filename for later retrieval
    const metadataDir = join(process.cwd(), 'uploads', 'metadata')
    try {
      // Create metadata directory if it doesn't exist
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true })
      }

      // Store metadata about this upload to help with retrieval
      const metadata = {
        dbPath: key, // Store the original key for reference
        filename: file.filename,
        originalFilename: file.originalname,
        uploadedAt: new Date().toISOString()
      }

      fs.writeFileSync(
        join(metadataDir, `${file.filename}.json`),
        JSON.stringify(metadata, null, 2)
      )

      console.log('Saved metadata for', file.filename)
    } catch (error) {
      console.error('Error saving metadata:', error)
    }

    // Important: The frontend expects the same key back in the response
    // It will build a URL as {urlPrefix}/{key}
    // For our /api/avatar/* endpoint to work, we need to return the key without modification
    // The frontend is updating the user record with this key
    res.json({
      success: true,
      key, // Return the original key unmodified - this is what goes in the DB
      urlPrefix: '', // No URL prefix for community version
      url: fileUrl // This is used for previews only
    })
  }

  // Helper endpoint to serve files uploaded via CDN tokens
  @Get('/api/cdn-files/:filename') // Changed to /api/cdn-files to avoid conflicts
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response
  ): Promise<void> {
    if (!filename) {
      throw new BadRequestException('Missing filename parameter')
    }

    // Redirect to the actual file location
    const baseUrl = getBaseUrl()
    const url = `${baseUrl.replace(
      /\/+$/,
      ''
    )}/static/upload/${encodeURIComponent(filename)}`

    // Redirect to the static file
    res.redirect(url)
  }

  // Updated endpoint to handle avatar paths in the format stored in the database
  @Get('/api/avatar/*')
  async getAvatar(@Req() req: any, @Res() res: Response): Promise<void> {
    // Get the path after /api/avatar/
    const avatarPath = req.url.replace('/api/avatar/', '')

    if (!avatarPath) {
      throw new BadRequestException('Missing avatar path')
    }

    console.log('======= AVATAR REQUEST =======')
    console.log('Request URL:', req.url)
    console.log('Avatar path:', avatarPath)

    try {
      // Try to find the file in the uploads directory
      const uploadsDir = join(process.cwd(), 'uploads')
      const metadataDir = join(uploadsDir, 'metadata')

      if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory does not exist:', uploadsDir)
        throw new BadRequestException('Uploads directory not found')
      }

      const files = fs
        .readdirSync(uploadsDir)
        .filter(file => !file.startsWith('.') && file !== 'metadata')
      console.log('Available files:', files)

      // First, directly check if this is an actual filename in the uploads directory
      if (files.includes(avatarPath)) {
        const baseUrl = getBaseUrl()
        const url = `${baseUrl.replace(
          /\/+$/,
          ''
        )}/static/upload/${encodeURIComponent(avatarPath)}`
        console.log('Direct file match found, redirecting to:', url)
        return res.redirect(url)
      }

      // Check if we have metadata for this file
      // The avatarPath will be in the format: {randomPrefix}/{userId}/{nanoid}_{filename}
      // The dbPath in metadata will have a leading slash: /{randomPrefix}/{userId}/{nanoid}_{filename}
      const avatarPathWithSlash = avatarPath.startsWith('/')
        ? avatarPath
        : `/${avatarPath}`

      if (fs.existsSync(metadataDir)) {
        console.log('Checking metadata directory:', metadataDir)
        const metadataFiles = fs.readdirSync(metadataDir)
        console.log('Metadata files count:', metadataFiles.length)

        // Try to find metadata that matches this DB path
        let foundMatch = false
        for (const metaFile of metadataFiles) {
          try {
            const metadataPath = join(metadataDir, metaFile)
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

            // Debug every 5th file to avoid console spam
            if (metadataFiles.indexOf(metaFile) % 5 === 0) {
              console.log('Sample metadata file:', metaFile)
              console.log('  stored dbPath:', metadata.dbPath)
              console.log('  looking for:', avatarPathWithSlash)
            }

            // Check if this metadata entry matches our path
            if (metadata.dbPath === avatarPathWithSlash) {
              foundMatch = true
              // We found the matching file through metadata!
              const baseUrl = getBaseUrl()
              const url = `${baseUrl.replace(
                /\/+$/,
                ''
              )}/static/upload/${encodeURIComponent(metadata.filename)}`
              console.log('Metadata match found, redirecting to:', url)
              return res.redirect(url)
            }
          } catch (error) {
            // Skip invalid metadata files
            console.warn(`Error reading metadata file ${metaFile}:`, error)
          }
        }

        if (!foundMatch) {
          console.log(
            'No metadata match found after checking',
            metadataFiles.length,
            'files'
          )
        }
      } else {
        console.log('No metadata directory exists')
      }

      // If we get here, try to extract the filename from the path
      // The format is /{randomPrefix}/{userId}/{nanoid}_{filename}
      // We'll use the last segment for matching
      const segments = avatarPath.split('/')
      const lastSegment = segments[segments.length - 1]
      console.log('Last path segment:', lastSegment)

      // If the last segment contains an underscore, it's likely in the format {nanoid}_{filename}
      const lastSegmentParts = lastSegment.split('_')
      let filenameToMatch

      if (lastSegmentParts.length > 1) {
        // Extract everything after the first underscore
        filenameToMatch = lastSegmentParts.slice(1).join('_')
      } else {
        filenameToMatch = lastSegment
      }

      console.log('Filename to match:', filenameToMatch)

      // Try to find a file that contains this filename
      const matchingFile = files.find(file => {
        const decodedFile = decodeURIComponent(file).toLowerCase()
        const decodedFilename = decodeURIComponent(
          filenameToMatch
        ).toLowerCase()
        return decodedFile.includes(decodedFilename)
      })

      console.log('Matching file found:', matchingFile)

      if (matchingFile) {
        // Redirect to the static file path
        const baseUrl = getBaseUrl()
        const url = `${baseUrl.replace(
          /\/+$/,
          ''
        )}/static/upload/${encodeURIComponent(matchingFile)}`
        console.log('Redirecting to:', url)
        return res.redirect(url)
      }

      // Last resort - try all the files by their decoded name
      for (const file of files) {
        // If the file is an image type, try to see if the decoded names match
        if (
          file.endsWith('.png') ||
          file.endsWith('.jpg') ||
          file.endsWith('.jpeg') ||
          file.endsWith('.gif')
        ) {
          const baseUrl = getBaseUrl()
          const url = `${baseUrl.replace(
            /\/+$/,
            ''
          )}/static/upload/${encodeURIComponent(file)}`
          console.log('Last resort - redirecting to most recent image:', url)
          return res.redirect(url)
        }
      }

      // If we still can't find anything, return a 404
      throw new BadRequestException('Avatar file not found')
    } catch (error) {
      console.error('Error handling avatar request:', error)
      throw new BadRequestException('Error serving avatar file')
    }
  }
}
