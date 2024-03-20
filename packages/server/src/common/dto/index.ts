import { Transform } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator'

export class ImageResizingDto {
  @IsUrl({
    require_protocol: true
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
