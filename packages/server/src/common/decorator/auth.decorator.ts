import { UseGuards, applyDecorators } from '@nestjs/common'

import { AuthGuard, BrowserIdGuard } from '@guard'

export function Auth(): any {
  return applyDecorators(UseGuards(BrowserIdGuard, AuthGuard))
}
