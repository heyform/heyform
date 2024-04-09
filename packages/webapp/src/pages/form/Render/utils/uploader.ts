import { FieldKindEnum, FileUploadValue, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

import { AppService } from '@/service'

interface UploaderField {
  id: string
  kind: FieldKindEnum
  value?: File | string
}

const UPLOAD_FIELD_KINDS = [FieldKindEnum.SIGNATURE, FieldKindEnum.FILE_UPLOAD]

export class Uploader {
  private readonly formId!: string
  private fields: UploaderField[] = []

  constructor(form: FormModel, values: any) {
    this.formId = form.id

    form.fields!.forEach(row => {
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
    const result = await AppService.upload(file)

    return {
      [field.id]: field.kind === FieldKindEnum.SIGNATURE ? result.url : result
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
