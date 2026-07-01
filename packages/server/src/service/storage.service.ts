import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { promises as fs } from 'fs'
import { resolve } from 'path'
import { mkdirp } from 'fs-extra'
import {
  S3_ACCESS_KEY_ID,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_URL,
  UPLOAD_DIR
} from '@environments'
import { helper } from '@heyform-inc/utils'

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null

  constructor() {
    if (
      helper.isValid(S3_ENDPOINT) &&
      helper.isValid(S3_REGION) &&
      helper.isValid(S3_BUCKET) &&
      helper.isValid(S3_ACCESS_KEY_ID) &&
      helper.isValid(S3_SECRET_ACCESS_KEY)
    ) {
      this.s3Client = new S3Client({
        endpoint: S3_ENDPOINT,
        region: S3_REGION,
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID,
          secretAccessKey: S3_SECRET_ACCESS_KEY
        }
      })
    }
  }

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      throw new Error('S3 configuration is missing or incomplete.')
    }
    return this.s3Client
  }

  public async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    formId: string,
    provider: 'vps' | 's3'
  ): Promise<string> {
    if (provider === 's3') {
      const client = this.getS3Client()
      const key = `forms/${formId}/${filename}`
      await client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: file,
          ContentType: mimeType,
          ACL: 'public-read'
        })
      )

      if (helper.isValid(S3_PUBLIC_URL)) {
        return `${S3_PUBLIC_URL.replace(/\/+$/, '')}/${key}`
      }
      const s3Url = new URL(S3_ENDPOINT)
      return `https://${S3_BUCKET}.${s3Url.hostname}/${key}`
    } else {
      // provider === 'vps'
      const dirPath = resolve(UPLOAD_DIR, formId)
      await mkdirp(dirPath)
      const filePath = resolve(dirPath, filename)
      await fs.writeFile(filePath, file)
      return `/static/upload/${formId}/${filename}`
    }
  }

  public async deleteFile(fileUrl: string, provider: 'vps' | 's3'): Promise<void> {
    if (provider === 's3') {
      const client = this.getS3Client()
      const keyIndex = fileUrl.indexOf('forms/')
      if (keyIndex === -1) {
        throw new Error(`Invalid S3 URL: ${fileUrl}`)
      }
      const key = fileUrl.substring(keyIndex)
      await client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key
        })
      )
    } else {
      // provider === 'vps'
      const staticUploadPath = '/static/upload/'
      const prefixIndex = fileUrl.indexOf(staticUploadPath)
      if (prefixIndex === -1) {
        throw new Error(`Invalid VPS URL: ${fileUrl}`)
      }
      const relativePath = fileUrl.substring(prefixIndex + staticUploadPath.length)
      const filePath = resolve(UPLOAD_DIR, relativePath)
      await fs.unlink(filePath).catch(() => undefined)
    }
  }

  public async deleteFormUploads(formId: string, provider: 'vps' | 's3'): Promise<void> {
    if (provider === 's3') {
      const client = this.s3Client ? this.getS3Client() : null
      if (!client) {
        return
      }
      const prefix = `forms/${formId}/`

      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix
      })
      const listResponse = await client.send(listCommand)

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }))
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: S3_BUCKET,
          Delete: {
            Objects: objectsToDelete
          }
        })
        await client.send(deleteCommand)
      }
    } else {
      // provider === 'vps'
      const dirPath = resolve(UPLOAD_DIR, formId)
      await fs.rm(dirPath, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}
