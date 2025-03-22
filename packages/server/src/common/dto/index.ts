import {
  IsFQDN,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl
} from 'class-validator'
import { Transform } from 'class-transformer'

export class ImageResizingDto {
  @Transform(value => value.replace(/\s/g, '%20'))
  @IsUrl({
    require_protocol: true,
    host_whitelist: [
      // Gravatar
      'secure.gravatar.com',

      // Login with Google
      'googleusercontent.com',
      /.+\.googleusercontent\.com/,

      // Unsplash
      'unsplash.com',
      /.+\.unsplash\.com/,

      // HeyForm
      'heyform.net',
      /.+\.heyform\.net/,

      // CDN
      'forms.b-cdn.net'
    ]
  })
  url: string

  @Transform(parseInt)
  @IsInt()
  @IsOptional()
  w?: number

  @Transform(parseInt)
  @IsInt()
  @IsOptional()
  h?: number

  @IsIn(['webp', 'jpeg', 'png'])
  @IsOptional()
  format?: string
}

export class CdnCallbackDto {
  @IsString()
  key: string

  @IsString()
  hash: string

  @IsNumber()
  size: number

  @IsString()
  name: string

  @IsString()
  endUser: string
}

export class ExportSubmissionsDto {
  @IsString({
    message: 'The form ID not allowed to be empty'
  })
  formId: string
}

export class CustomDomainVerificationDto {
  @IsString()
  key: string

  @IsString()
  @IsFQDN()
  domain: string
}

export class PublicApiDto {
  @IsString({
    message: 'The key is not allowed to be empty'
  })
  key: string
}

export class ChatDto extends ExportSubmissionsDto {
  @IsString({
    message: 'The prompt is not allowed to be empty'
  })
  prompt: string

  @IsString({
    message: 'The language is not allowed to be empty'
  })
  language: string
}
