import { BadRequestException, ValidationPipe } from '@nestjs/common'
import assert from 'assert'
import 'reflect-metadata'

import {
  CreateBrandKitInput,
  CreateFormInput,
  CreateTeamInput,
  InviteMemberInput,
  LoginInput,
  SignUpInput,
  SubmissionAnswersInput,
  SubmissionsInput,
  UpdateSubmissionsCategoryInput,
  UpdateTeamInput,
  VerifyPasswordInput
} from '../src/common/graphql'

// The pipe as main.ts installs it
const pipe = new ValidationPipe({ forbidUnknownValues: false })

type InputClass = new () => object

async function messages(metatype: InputClass, value: Record<string, any>): Promise<string[]> {
  try {
    await pipe.transform(value, { type: 'body', metatype })
    return []
  } catch (error) {
    assert.ok(error instanceof BadRequestException, String(error))
    return [(error.getResponse() as any).message].flat()
  }
}

async function accepts(metatype: InputClass, value: Record<string, any>) {
  assert.deepStrictEqual(await messages(metatype, value), [], JSON.stringify(value))
}

async function rejects(metatype: InputClass, value: Record<string, any>, message?: RegExp) {
  const found = await messages(metatype, value)

  assert.ok(found.length > 0, `accepted ${JSON.stringify(value)}`)

  if (message) {
    assert.ok(
      found.some(row => message.test(row)),
      found.join('; ')
    )
  }
}

async function testWorkspaceNameIsOneToThirtyCharacters() {
  const limit = /limited to 30 characters/

  await accepts(CreateTeamInput, { name: 'A', projectName: 'General' })
  await accepts(CreateTeamInput, { name: 'x'.repeat(30), projectName: 'General' })
  await rejects(CreateTeamInput, { name: '', projectName: 'General' }, limit)
  await rejects(CreateTeamInput, { name: 'x'.repeat(31), projectName: 'General' }, limit)
  await rejects(CreateTeamInput, { projectName: 'General' }, limit)

  // An update may leave the name out, but not blank it
  await accepts(UpdateTeamInput, { teamId: 'team_1' })
  await accepts(UpdateTeamInput, { teamId: 'team_1', name: 'x'.repeat(30) })
  await rejects(UpdateTeamInput, { teamId: 'team_1', name: '' }, limit)
  await rejects(UpdateTeamInput, { teamId: 'team_1', name: 'x'.repeat(31) }, limit)
}

async function testWorkspaceSettingsTakeAUrlAndABoolean() {
  await accepts(UpdateTeamInput, {
    teamId: 'team_1',
    avatar: 'https://example.com/a.png',
    removeBranding: false
  })
  await rejects(UpdateTeamInput, { teamId: 'team_1', avatar: 'not a url' })
  await rejects(UpdateTeamInput, { teamId: 'team_1', avatar: 'javascript:alert(1)' })
  await rejects(UpdateTeamInput, { teamId: 'team_1', removeBranding: 'yes' })

  await accepts(CreateBrandKitInput, { teamId: 'team_1', theme: {} })
  await rejects(CreateBrandKitInput, { teamId: 'team_1', theme: 'dark' })
  await rejects(CreateBrandKitInput, { teamId: 'team_1', theme: {}, logo: 'not a url' })
}

async function testInvitationTakesOneToTwentyDistinctAddresses() {
  const emails = (count: number) => Array.from({ length: count }, (_, i) => `user${i}@example.com`)

  await accepts(InviteMemberInput, { teamId: 'team_1', emails: emails(1) })
  await accepts(InviteMemberInput, { teamId: 'team_1', emails: emails(20) })
  await rejects(InviteMemberInput, { teamId: 'team_1', emails: [] })
  await rejects(InviteMemberInput, { teamId: 'team_1', emails: emails(21) })
  await rejects(InviteMemberInput, { teamId: 'team_1' })

  await rejects(InviteMemberInput, { teamId: 'team_1', emails: ['a@example.com', 'nobody'] })
  await rejects(InviteMemberInput, { teamId: 'team_1', emails: ['a@example.com', ''] })
  // One address spelled twice would be sent two invitations
  await rejects(InviteMemberInput, {
    teamId: 'team_1',
    emails: ['a@example.com', 'A@Example.com']
  })
}

async function testSignUpNeedsAnAddressANameAndAStrongPassword() {
  const valid = { email: 'ada@example.com', name: 'Ada', password: 'Passw0rd' }

  await accepts(SignUpInput, valid)
  await accepts(SignUpInput, { ...valid, password: 'Passw0rd!#$%' })
  await accepts(SignUpInput, { ...valid, name: 'x'.repeat(100) })

  await rejects(SignUpInput, { ...valid, email: 'ada@' }, /Invalid email address/)
  await rejects(SignUpInput, { ...valid, email: '' }, /Invalid email address/)
  await rejects(SignUpInput, { ...valid, name: '' }, /limited to 100 characters/)
  await rejects(SignUpInput, { ...valid, name: 'x'.repeat(101) }, /limited to 100 characters/)

  // At least 8 characters with a lower case letter, an upper case letter and a digit
  for (const password of [
    'Pass0rd',
    'password1',
    'PASSWORD1',
    'Passwordd',
    'Pass w0rd',
    `Passw0rd${'x'.repeat(93)}`
  ]) {
    await rejects(SignUpInput, { ...valid, password }, /Invalid password/)
  }
}

async function testLoginRejectsWhatCannotBeACredential() {
  await accepts(LoginInput, { email: 'ada@example.com', password: 'whatever' })
  await rejects(LoginInput, { email: 'ada', password: 'whatever' }, /Invalid email address/)
  await rejects(LoginInput, { email: 'ada@example.com', password: 'short' }, /Invalid password/)
  await rejects(LoginInput, { email: 'ada@example.com', password: 'x'.repeat(101) })
  await rejects(LoginInput, { email: 'ada@example.com' })
}

async function testNewFormNeedsAKnownModeAndKind() {
  const valid = { projectId: 'project_1', interactiveMode: 1, kind: 1 }

  await accepts(CreateFormInput, valid)
  await accepts(CreateFormInput, { ...valid, name: 'Survey', nameSchema: ['Survey'] })
  await rejects(CreateFormInput, { ...valid, interactiveMode: 99 })
  await rejects(CreateFormInput, { ...valid, kind: 99 })
  await rejects(CreateFormInput, { projectId: 'project_1', kind: 1 })
  await rejects(CreateFormInput, { ...valid, nameSchema: 'Survey' })
}

async function testInboxPageSizeAndCategoryAreBounded() {
  await accepts(SubmissionsInput, { formId: 'form_1' })
  await accepts(SubmissionsInput, { formId: 'form_1', category: 'inbox', limit: 10 })
  await accepts(SubmissionsInput, { formId: 'form_1', category: 'spam', limit: 30 })
  await rejects(SubmissionsInput, { formId: 'form_1', limit: 9 })
  // A page of any size would let one request load every response of a form
  await rejects(SubmissionsInput, { formId: 'form_1', limit: 31 })
  await rejects(SubmissionsInput, { formId: 'form_1', category: 'everything' })

  await accepts(SubmissionAnswersInput, { formId: 'form_1', fieldId: 'f1', page: 1, limit: 30 })
  await rejects(SubmissionAnswersInput, { formId: 'form_1', fieldId: 'f1', page: 0 })
  await rejects(SubmissionAnswersInput, { formId: 'form_1', fieldId: 'f1', page: '2' })
  await rejects(SubmissionAnswersInput, { formId: 'form_1', fieldId: 'f1', limit: 31 })
  await rejects(SubmissionAnswersInput, { formId: 'form_1', fieldId: 'f1', otherOnly: 'yes' })

  const update = { formId: 'form_1', submissionIds: ['s1'] }

  for (const category of ['inbox', 'spam', 'starred', 'archive']) {
    await accepts(UpdateSubmissionsCategoryInput, { ...update, category })
  }
  await rejects(UpdateSubmissionsCategoryInput, { ...update, category: 'deleted' })
  await rejects(UpdateSubmissionsCategoryInput, update)
}

async function testFormPasswordIsOneTo128Characters() {
  await accepts(VerifyPasswordInput, { formId: 'form_1', password: 'x' })
  await accepts(VerifyPasswordInput, { formId: 'form_1', password: 'x'.repeat(128) })
  await rejects(VerifyPasswordInput, { formId: 'form_1', password: '' })
  // Hashing is paid per attempt, so the length is capped before it is hashed
  await rejects(VerifyPasswordInput, { formId: 'form_1', password: 'x'.repeat(129) })
}

async function run() {
  await testWorkspaceNameIsOneToThirtyCharacters()
  await testWorkspaceSettingsTakeAUrlAndABoolean()
  await testInvitationTakesOneToTwentyDistinctAddresses()
  await testSignUpNeedsAnAddressANameAndAStrongPassword()
  await testLoginRejectsWhatCannotBeACredential()
  await testNewFormNeedsAKnownModeAndKind()
  await testInboxPageSizeAndCategoryAreBounded()
  await testFormPasswordIsOneTo128Characters()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
