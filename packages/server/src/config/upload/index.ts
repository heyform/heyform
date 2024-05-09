import { diskStorage } from 'multer'
import { mkdirpSync, pathExistsSync } from 'fs-extra'
import { helper, nanoid } from '@heyform-inc/utils'
import * as multerS3 from 'multer-s3'
import { S3Client } from '@aws-sdk/client-s3'

import {
  S3_ACCESS_KEY_ID,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
  UPLOAD_DIR
} from '@environments'

export function getMulterStorage() {
  if (
    helper.isValid(S3_ENDPOINT) &&
    helper.isValid(S3_REGION) &&
    helper.isValid(S3_BUCKET) &&
    helper.isValid(S3_ACCESS_KEY_ID) &&
    helper.isValid(S3_SECRET_ACCESS_KEY)
  ) {
    const s3 = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY
      }
    })

    return multerS3({
      s3,
      acl: 'public-read',
      bucket: S3_BUCKET,
      metadata: (req: any, file: any, cb: any) => {
        cb(null, { fieldName: file.fieldname })
      },
      key: (req: any, file: any, cb: any) => {
        cb(null, `${nanoid(12)}-${file.originalname}`)
      }
    })
  }

  return diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = UPLOAD_DIR

      if (!pathExistsSync(uploadPath)) {
        mkdirpSync(uploadPath)
      }

      cb(null, uploadPath)
    },
    filename: (req: any, file: any, cb: any) => {
      cb(null, `${nanoid(12)}-${file.originalname}`)
    }
  })
}
