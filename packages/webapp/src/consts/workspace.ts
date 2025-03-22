export enum SubscriptionStatusEnum {
  PENDING = 0,
  ACTIVE = 1,
  EXPIRED = 2
}

export enum BillingCycleEnum {
  FOREVER = 0,
  MONTHLY,
  ANNUALLY
}

export enum PlanGradeEnum {
  FREE = 0,
  BASIC = 1,
  PREMIUM = 2,
  BUSINESS = 3,
  ENTERPRISE = 4
}

export const PLAN_NAMES = {
  [PlanGradeEnum.FREE]: 'Free',
  [PlanGradeEnum.BASIC]: 'Basic',
  [PlanGradeEnum.PREMIUM]: 'Premium',
  [PlanGradeEnum.BUSINESS]: 'Business',
  [PlanGradeEnum.ENTERPRISE]: 'Enterprise'
}

export const USER_STORAGE_KEY = 'HEYFORM_USER'
export const WORKSPACE_STORAGE_KEY = 'HEYFORM_WORKSPACE'
export const APPEARANCE_STORAGE_KEY = 'HEYFORM_APPEARANCE'
export const ONBOARDING_STORAGE_KEY = 'HEYFORM_ONBOARDING'
export const CHANGELOG_STORAGE_KEY = 'HEYFORM_CHANGELOG'

export const DEFAULT_PROJECT_NAMES: AnyMap = {
  de: "{name}'s Projekt",
  en: "{name}'s project",
  fr: 'Projet de {name}',
  ja: '{name}のプロジェクト',
  pl: 'Projekt {name}',
  'zh-cn': '{name}的项目',
  'zh-hk': '{name}的項目',
  'zh-tw': '{name}的專案'
}

export const APPEARANCE_OPTIONS = [
  {
    label: 'workspace.appearance.system',
    value: 'system'
  },
  {
    label: 'workspace.appearance.light',
    value: 'light'
  },
  {
    label: 'workspace.appearance.dark',
    value: 'dark'
  }
]
