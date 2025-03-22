import { PlanGradeEnum } from '@model'

const owner: Record<string, any> = {
  _id: '500000000000000000000001',
  name: '🍔 Owner',
  email: 'owner@heyform.net',
  password: 'Pa33W0rd',
  deviceId: 'owner-device',
  teamName: '🍔 Owner',
  teamId: 'owner-id',
  projectName: '🍔 Owner',
  projectId: 'owner-id',
  formName: '🍔 Owner',
  formId: 'owner-id',
  planGrade: PlanGradeEnum.BUSINESS
}

const member: Record<string, any> = {
  _id: '500000000000000000000002',
  name: '🍎 Member',
  email: 'member@heyform.net',
  password: 'Pa33W0rd',
  deviceId: 'member-device',
  teamName: '🍎 Member',
  teamId: 'member-id',
  projectName: '🍎 Member',
  projectId: 'member-id',
  formName: '🍎 Member',
  formId: 'member-id',
  planGrade: PlanGradeEnum.FREE
}

const tester: Record<string, any> = {
  _id: '500000000000000000000003',
  name: '🌀 Tester',
  email: 'tester@heyform.net',
  password: 'Pa33W0rd',
  deviceId: 'tester-device',
  teamName: '🌀 Tester',
  teamId: 'tester-id',
  projectName: '🌀 Tester',
  projectId: 'tester-id',
  formName: '🌀 Tester',
  formId: 'tester-id',
  planGrade: PlanGradeEnum.FREE
}

export default {
  owner,
  member,
  tester
}
