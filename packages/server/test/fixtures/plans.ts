import { PlanGradeEnum, PlanModel } from '@model'

export default [
  {
    _id: '5f69647e0f2c111b86d0c365',
    name: 'HeyForm Free',
    memberLimit: 1,
    contactLimit: 0,
    formLimit: -1,
    questionLimit: -1,
    submissionLimit: -1,
    storageLimit: '100MB',
    apiAccessLimit: 0,
    autoResponse: false,
    fileExport: false,
    customDomain: false,
    customUrlRedirects: false,
    customThankYouPage: false,
    whitelabelBranding: false,
    passwordProtection: false,
    themeCustomization: false,
    grade: PlanGradeEnum.FREE
  },
  {
    _id: '5f69647e0f2c111b86d0c367',
    name: 'HeyForm Business',
    memberLimit: 30,
    contactLimit: 1000,
    formLimit: -1,
    questionLimit: -1,
    submissionLimit: -1,
    storageLimit: '50GB',
    apiAccessLimit: 0,
    autoResponse: true,
    fileExport: true,
    customDomain: true,
    customUrlRedirects: true,
    customThankYouPage: true,
    whitelabelBranding: true,
    passwordProtection: true,
    themeCustomization: true,
    grade: PlanGradeEnum.BUSINESS
  }
] as PlanModel[]
