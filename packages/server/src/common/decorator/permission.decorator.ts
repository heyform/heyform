import { PermissionGuard, PermissionScopeEnum } from '@guard'
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'

export function TeamGuard(): any {
  return applyDecorators(
    SetMetadata('scope', PermissionScopeEnum.team),
    UseGuards(PermissionGuard)
  )
}

export function ProjectGuard(): any {
  return applyDecorators(
    SetMetadata('scope', PermissionScopeEnum.project),
    UseGuards(PermissionGuard)
  )
}

export function FormGuard(): any {
  return applyDecorators(
    SetMetadata('scope', PermissionScopeEnum.form),
    UseGuards(PermissionGuard)
  )
}
