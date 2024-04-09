import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator'
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

export class ExportSubmissionsDto {
  @IsString()
  formId: string
}
