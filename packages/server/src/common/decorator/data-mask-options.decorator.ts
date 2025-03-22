import { TypeFunc } from '@interceptor'
import { SetMetadata } from '@nestjs/common'
import { CustomDecorator } from '@nestjs/common/decorators/core/set-metadata.decorator'
import { ClassTransformOptions } from 'class-transformer'

export const DATA_MASK_OPTIONS = 'DATA_MASK_OPTIONS'

export const DataMaskOptions = (
  typeFunc: TypeFunc,
  options?: ClassTransformOptions
): CustomDecorator<any> => {
  return SetMetadata(DATA_MASK_OPTIONS, {
    ...(options || {}),
    typeFunc
  })
}
