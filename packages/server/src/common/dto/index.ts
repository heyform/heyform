import { Transform } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator'
import { APP_HOMEPAGE_URL } from '@environments'

export class ImageResizingDto {
  @IsUrl({
    require_protocol: true,
    host_whitelist: [
      '127.0.0.1',
      'localhost',
      'secure.gravatar.com',
      'googleusercontent.com',
      'images.unsplash.com',
      'unsplash.com',
      new URL(APP_HOMEPAGE_URL).hostname
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
  @IsString()
  formId: string
}
