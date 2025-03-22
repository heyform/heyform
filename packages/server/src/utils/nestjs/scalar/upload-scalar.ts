import { CustomScalar, Scalar } from '@nestjs/graphql'
import { ValueNode } from 'graphql'
import FileUpload from 'graphql-upload/Upload.mjs'

export type UploadProps = Promise<FileUpload>

@Scalar('Upload', () => Upload)
export class Upload implements CustomScalar<UploadProps, UploadProps> {
  parseLiteral(file: ValueNode) {
    if (file.kind === 'ObjectValue') {
      const fileObject = file as any
      if (
        typeof fileObject.filename === 'string' &&
        typeof fileObject.mimetype === 'string' &&
        typeof fileObject.encoding === 'string' &&
        typeof fileObject.createReadStream === 'function'
      ) {
        return Promise.resolve(fileObject)
      }
    }

    return null
  }

  async parseValue(value: UploadProps) {
    const upload = await value
    return upload
  }

  serialize(value: UploadProps) {
    return value
  }
}
