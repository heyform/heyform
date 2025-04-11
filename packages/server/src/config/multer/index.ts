import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { nanoid } from '@heyform-inc/utils'
import * as fs from 'fs'

// Ensure upload directory exists with proper path
const uploadDir = join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log(`Created upload directory at ${uploadDir}`)
  } catch (error) {
    console.error(`Error creating upload directory: ${error.message}`)
  }
}

export function getMulterStorage() {
  return diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = nanoid()
      const ext = extname(file.originalname)
      cb(null, `${uniqueSuffix}${ext}`)
    }
  })
}
