import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common'

import { PermissionGuard, PermissionScopeEnum } from '@guard'

export function TeamGuard(): any {
  return applyDecorators(SetMetadata('scope', PermissionScopeEnum.team), UseGuards(PermissionGuard))
}

export function ProjectGuard(): any {
  return applyDecorators(
    SetMetadata('scope', PermissionScopeEnum.project),
    UseGuards(PermissionGuard)
  )
}

export function FormGuard(): any {
  return applyDecorators(SetMetadata('scope', PermissionScopeEnum.form), UseGuards(PermissionGuard))
}
