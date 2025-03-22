import { AuthGuard, DeviceIdGuard } from '@guard'
import { applyDecorators, UseGuards } from '@nestjs/common'

export function Auth(): any {
  return applyDecorators(UseGuards(DeviceIdGuard, AuthGuard))
}
