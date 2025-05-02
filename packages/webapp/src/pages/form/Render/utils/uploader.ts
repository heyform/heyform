import { FieldKindEnum, FileUploadValue, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

import { flattenFieldsWithGroups } from '@/pages/form/views/FormComponents'
import { AppService, UserService } from '@/services'

interface UploaderField {
  id: string
  kind: FieldKindEnum
  value?: File | string
}

const UPLOAD_FIELD_KINDS = [FieldKindEnum.SIGNATURE, FieldKindEnum.FILE_UPLOAD]

export class Uploader {
  private fields: UploaderField[] = []

  constructor(form: FormModel, values: any) {
    flattenFieldsWithGroups(form.fields!).forEach(row => {
      if (UPLOAD_FIELD_KINDS.includes(row.kind)) {
        let value = values[row.id]

        if (helper.isValid(value)) {
          if (row.kind === FieldKindEnum.SIGNATURE) {
            value = this.b64ImageURLToBlob(value as string) as File
          }

          this.fields.push({
            id: row.id,
            kind: row.kind,
            value
          })
        }
      }
    })
  }

  async start() {
    let result: any = {}

    if (helper.isValid(this.fields)) {
      const promises = this.fields.map(field => {
        return this.uploadFile(field)
      })
      const values = await Promise.all(promises)

      values.forEach(row => {
        result = {
          ...result,
          ...row
        }
      })
    }

    return result
  }

  async uploadFile(field: UploaderField): Promise<Record<string, FileUploadValue | string>> {
    const file = field.value as File
    const data = await UserService.cdnToken(file.name, file.type)
    const { token, urlPrefix, key } = data
    const url = `${urlPrefix}/${key}`
    await AppService.upload(file, key, token)

    if (field.kind === FieldKindEnum.SIGNATURE) {
      return { [field.id]: url }
    }

    return {
      [field.id]: {
        filename: file.name,
        key,
        urlPrefix,
        url,
        size: file.size
      }
    }
  }

  b64ImageURLToBlob(b64ImageURL: string): Blob {
    const [prefix, data] = b64ImageURL.split(',')
    const type = prefix.split(':')[1].split(';')[0]
    const bytes = atob(data)
    const arrayBuffer = new ArrayBuffer(bytes.length)
    const intArray = new Uint8Array(arrayBuffer)

    for (let i = 0; i < bytes.length; i++) {
      intArray[i] = bytes.charCodeAt(i)
    }

    const blob: any = new Blob([intArray], { type })
    blob.name = 'signature.png'

    return blob
  }
}
