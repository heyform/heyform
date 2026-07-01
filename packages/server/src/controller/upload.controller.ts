import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { extname } from 'path'
import { memoryStorage } from 'multer'
import { nanoid } from '@heyform-inc/utils'

import { COOKIE_DEVICE_ID_NAME } from '@config'
import { UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPES } from '@environments'
import { helper } from '@heyform-inc/utils'
import { AuthService, EndpointService, FormService, StorageService } from '@service'
import { isAllowedUploadField } from '@utils'

const BLOCKED_UPLOAD_EXTENSIONS = new Set(['.svg', '.svgz'])
const BLOCKED_UPLOAD_MIME_TYPES = new Set(['image/svg+xml', 'application/svg+xml'])

function getUploadContextValue(
  req: any,
  key: 'fieldId' | 'formId' | 'openToken'
): string | undefined {
  const headerName = `x-heyform-${key.replace(/[A-Z]/g, matched => `-${matched.toLowerCase()}`)}`
  const value = req.get?.(headerName) || req.query?.[key]
  return Array.isArray(value) ? value[0] : value
}

@Controller()
export class UploadController {
  constructor(
    private readonly authService: AuthService,
    private readonly endpointService: EndpointService,
    private readonly formService: FormService,
    private readonly storageService: StorageService
  ) {}

  @Post('/api/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: UPLOAD_FILE_SIZE
      },
      storage: memoryStorage()
    })
  )
  async index(
    @Req() req: any,
    @UploadedFile() file: any
  ): Promise<{ filename: string; url: string; size: number }> {
    if (!file) {
      throw new BadRequestException('No upload file provided')
    }

    this.assertFileTypeAllowed(file)
    await this.assertUploadAllowed(req)

    const formId = getUploadContextValue(req, 'formId')
    let provider: 'vps' | 's3' = 'vps'
    let maxUploadSizeMb = 5

    if (helper.isValid(formId)) {
      const form = await this.formService.findById(formId)
      if (form) {
        provider = (form.storageProvider || 'vps') as 'vps' | 's3'
        maxUploadSizeMb = form.maxUploadSizeMb || 5
      }
    }

    if (file.size > maxUploadSizeMb * 1024 * 1024) {
      throw new BadRequestException(`File exceeds the ${maxUploadSizeMb}MB limit set for this form`)
    }

    const filename = `${nanoid(12)}${extname(file.originalname)}`
    const url = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      formId || 'global',
      provider
    )

    return {
      filename: file.originalname,
      size: file.size,
      url
    }
  }

  private assertFileTypeAllowed(file: any): void {
    const extension = extname(file.originalname).toLowerCase()
    const mimeType = String(file.mimetype || '').toLowerCase()

    if (
      BLOCKED_UPLOAD_EXTENSIONS.has(extension) ||
      BLOCKED_UPLOAD_MIME_TYPES.has(mimeType) ||
      !UPLOAD_FILE_TYPES.includes(mimeType)
    ) {
      throw new BadRequestException(`Unsupported file type ${extname(file.originalname)}`)
    }
  }

  private async assertUploadAllowed(req: any): Promise<void> {
    if (await this.isAuthenticatedRequest(req)) {
      return
    }

    const fieldId = getUploadContextValue(req, 'fieldId')
    const formId = getUploadContextValue(req, 'formId')
    const openToken = getUploadContextValue(req, 'openToken')

    if (!helper.isValid(formId) || !helper.isValid(openToken) || !helper.isValid(fieldId)) {
      throw new BadRequestException('Invalid upload context')
    }

    const token = this.endpointService.decryptToken(openToken)

    if (token.formId !== formId) {
      throw new BadRequestException('Invalid upload context')
    }

    const form = await this.formService.findById(formId)

    if (!form || form.suspended || form.settings?.active !== true) {
      throw new BadRequestException('The form is not available')
    }

    if (!isAllowedUploadField(form, fieldId)) {
      throw new BadRequestException('The upload field is not allowed')
    }
  }

  private async isAuthenticatedRequest(req: any): Promise<boolean> {
    const session = this.authService.getSession(req)
    const deviceId = req.get('x-device-id') || req.cookies?.[COOKIE_DEVICE_ID_NAME]

    if (
      helper.isEmpty(session?.id) ||
      helper.isEmpty(session?.deviceId) ||
      deviceId !== session.deviceId
    ) {
      return false
    }

    return !(await this.authService.isExpired(session.id, session.deviceId))
  }
}
