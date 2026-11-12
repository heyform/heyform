import { FieldKindEnum, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { CreateFormResolver } from '../src/resolver/form/create-form.resolver'
import { DeleteFormResolver } from '../src/resolver/form/delete-form.resolver'
import { DuplicateFormResolver } from '../src/resolver/form/duplicate-form.resolver'
import { FormsResolver } from '../src/resolver/form/forms.resolver'
import { MoveFormToTrashResolver } from '../src/resolver/form/move-form-to-trash.resolver'
import { MoveFormResolver } from '../src/resolver/form/move-form.resolver'
import { PublishFormResolver } from '../src/resolver/form/publish-form.resolver'
import { RestoreFormResolver } from '../src/resolver/form/restore-form.resolver'
import { UpdateFormArchiveResolver } from '../src/resolver/form/update-form-archive.resolver'
import { UpdateFormLogicsResolver } from '../src/resolver/form/update-form-logics.resolver'
import { UpdateFormSchemasResolver } from '../src/resolver/form/update-form-schemas.resolver'
import { DeleteFormInTrashSchedule } from '../src/schedule/delete-form-in-trash.schedule'
import { FormService } from '../src/service/form.service'

import { createWorkspaceStore } from './helpers/workspace'

const DAY = 24 * 60 * 60

const question = { id: 'q1', kind: FieldKindEnum.SHORT_TEXT, title: ['Name'] }
const ending = { id: 'end', kind: FieldKindEnum.THANK_YOU, title: ['Thanks'] }
const logics = [{ fieldId: 'q1', payloads: [] }]

// Olivia's workspace with one project. Carl is a collaborator in it.
async function setup() {
  const store = createWorkspaceStore()
  const owner = store.addUser('Olivia')
  const collaborator = store.addUser('Carl')
  const { teamId, projectId } = await store.addTeam(owner, 'Acme')

  await store.addTeamMember(teamId, collaborator)
  await store.projectService.createMember({ projectId, memberId: collaborator.id })

  return { store, owner, collaborator, teamId, projectId }
}

function formOf(store: ReturnType<typeof createWorkspaceStore>, formId: string) {
  return store.forms.find(row => row.id === formId)
}

async function testNewFormIsAnUnpublishedDraft() {
  const { store, collaborator, teamId, projectId } = await setup()
  const resolver = new CreateFormResolver(store.formService as any)
  const { team } = await store.inProject(collaborator, projectId)

  const formId = await resolver.createForm(team, collaborator as any, {
    projectId,
    name: '  Feedback  ',
    interactiveMode: 1,
    kind: 1
  })
  const form = formOf(store, formId)

  assert.strictEqual(form.name, 'Feedback')
  // The workspace is the one the project belongs to, not something the request names
  assert.strictEqual(form.teamId, teamId)
  assert.strictEqual(form.projectId, projectId)
  assert.strictEqual(form.memberId, collaborator.id)
  assert.strictEqual(form.status, FormStatusEnum.NORMAL)
  assert.strictEqual(form.settings.active, false)
  assert.strictEqual(form.version, 0)

  // Nothing is published yet: the starter question and ending are drafts
  assert.deepStrictEqual(form.fields, [])
  assert.deepStrictEqual(
    JSON.parse(form._drafts).map((field: any) => field.kind),
    [FieldKindEnum.SHORT_TEXT, FieldKindEnum.THANK_YOU]
  )
}

async function testFormWithoutANameIsUntitled() {
  const { store, owner, projectId } = await setup()
  const resolver = new CreateFormResolver(store.formService as any)
  const { team } = await store.inProject(owner, projectId)

  for (const name of [undefined, '', '   ']) {
    const formId = await resolver.createForm(team, owner as any, {
      projectId,
      name,
      interactiveMode: 1,
      kind: 1
    })

    assert.strictEqual(formOf(store, formId).name, 'Untitled', JSON.stringify(name))
  }
}

async function testDuplicateIsAnUnpublishedCopyOfTheCallers() {
  const { store, owner, collaborator, teamId, projectId } = await setup()
  const formId = await store.addForm({
    teamId,
    projectId,
    memberId: owner.id,
    name: 'Survey',
    fields: [question, ending],
    _drafts: JSON.stringify([question, { ...ending, title: ['Edited'] }]),
    logics,
    hiddenFields: [{ id: 'h1', name: 'utm' }],
    settings: { active: true, allowArchive: true, locale: 'de' },
    themeSettings: { theme: { fontFamily: 'Inter' } },
    publishedAt: 100,
    version: 7
  })

  store.addSubmission(formId)

  const copyId = await new DuplicateFormResolver(store.formService as any).duplicateForm(
    collaborator as any,
    (await store.inForm(collaborator, formId)).form,
    { formId, name: 'Survey (copy)' }
  )
  const copy = formOf(store, copyId)

  assert.notStrictEqual(copyId, formId)
  assert.strictEqual(copy.name, 'Survey (copy)')
  assert.strictEqual(copy.memberId, collaborator.id)
  assert.strictEqual(copy.teamId, teamId)
  assert.strictEqual(copy.projectId, projectId)

  // The copy keeps the content and settings, and is not open to respondents
  assert.deepStrictEqual(copy.settings, { active: false, allowArchive: true, locale: 'de' })
  assert.deepStrictEqual(copy.fields, [])
  assert.strictEqual(copy._drafts, formOf(store, formId)._drafts)
  assert.deepStrictEqual(copy.logics, logics)
  assert.deepStrictEqual(copy.hiddenFields, [{ id: 'h1', name: 'utm' }])
  assert.deepStrictEqual(copy.themeSettings, { theme: { fontFamily: 'Inter' } })
  assert.strictEqual(copy.publishedAt, undefined)

  // The original is as it was, and its submissions stay with it
  assert.strictEqual(formOf(store, formId).settings.active, true)
  assert.strictEqual(formOf(store, formId).memberId, owner.id)
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [formId]
  )
}

async function testDuplicateOfAFormWithoutDraftsStartsFromThePublishedFields() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({ teamId, projectId, fields: [question, ending] })

  const copyId = await new DuplicateFormResolver(store.formService as any).duplicateForm(
    owner as any,
    (await store.inForm(owner, formId)).form,
    { formId, name: 'Copy' }
  )

  assert.deepStrictEqual(JSON.parse(formOf(store, copyId)._drafts), [question, ending])
  assert.deepStrictEqual(formOf(store, copyId).fields, [])
}

async function testFormOnlyMovesToAProjectOfTheCallerInTheSameWorkspace() {
  const { store, owner, collaborator, teamId, projectId } = await setup()
  const sharedProjectId = await store.addProject(teamId, owner, 'Shared', [collaborator])
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const other = await store.addTeam(collaborator, 'Carl’s')
  const formId = await store.addForm({ teamId, projectId })
  const resolver = new MoveFormResolver(store.projectService as any, store.formService as any)
  const move = async (targetProjectId: string) =>
    resolver.moveForm((await store.inForm(collaborator, formId)).team, collaborator as any, {
      formId,
      targetProjectId
    })

  // A project of the workspace Carl is not in, a project of his own workspace, and none at all
  for (const targetProjectId of [privateProjectId, other.projectId, 'missing']) {
    assert.strictEqual(await move(targetProjectId), false, targetProjectId)
    assert.strictEqual(formOf(store, formId).projectId, projectId)
  }

  assert.strictEqual(await move(sharedProjectId), true)
  assert.strictEqual(formOf(store, formId).projectId, sharedProjectId)
  assert.strictEqual(formOf(store, formId).teamId, teamId)
}

async function testTrashedFormClosesAndCanBeRestored() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({
    teamId,
    projectId,
    settings: { active: true, allowArchive: true }
  })
  const { form } = await store.inForm(owner, formId)
  const now = Math.floor(Date.now() / 1000)

  store.addSubmission(formId)

  await new MoveFormToTrashResolver(store.formService as any).moveFormToTrash(form, { formId })

  const trashed = formOf(store, formId)

  assert.strictEqual(trashed.status, FormStatusEnum.TRASH)
  // A form in the trash stops taking responses, and is kept for 30 days
  assert.deepStrictEqual(trashed.settings, { active: false, allowArchive: true })
  assert.ok(Math.abs(trashed.retentionAt - (now + 30 * DAY)) < 60)
  assert.strictEqual(store.submissions.length, 1)

  await new RestoreFormResolver(store.formService as any).restoreForm(form, { formId })

  const restored = formOf(store, formId)

  assert.strictEqual(restored.status, FormStatusEnum.NORMAL)
  assert.strictEqual(restored.retentionAt, -1)
  // Restoring does not reopen the form: that is the owner's call
  assert.strictEqual(restored.settings.active, false)
  assert.strictEqual(store.submissions.length, 1)
}

async function testDeletingATrashedFormTakesItsSubmissions() {
  const { store, owner, teamId, projectId } = await setup()
  const trashedId = await store.addForm({ teamId, projectId, status: FormStatusEnum.TRASH })
  const otherId = await store.addForm({ teamId, projectId })
  const resolver = new DeleteFormResolver(store.formService as any, store.submissionService as any)

  store.addSubmission(trashedId)
  store.addSubmission(trashedId)
  store.addSubmission(otherId)

  await store.inForm(owner, trashedId)
  assert.strictEqual(await resolver.deleteForm({ formId: trashedId }), true)

  assert.deepStrictEqual(
    store.forms.map(form => form.id),
    [otherId]
  )
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [otherId]
  )
}

// Only a form in the trash is deleted for good. Asking for a live one deletes nothing, and
// that has to include its submissions.
async function testDeletingALiveFormKeepsItsSubmissions() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({ teamId, projectId })
  const resolver = new DeleteFormResolver(store.formService as any, store.submissionService as any)

  store.addSubmission(formId)
  store.addSubmission(formId)

  await store.inForm(owner, formId)
  await resolver.deleteForm({ formId })

  assert.strictEqual(formOf(store, formId).status, FormStatusEnum.NORMAL)
  assert.strictEqual(store.submissions.length, 2)
}

// Every other way a form is deleted takes its submissions with it. The 30 days in the trash
// running out must not be the one that keeps the respondents' data.
async function testExpiredTrashIsDeletedWithItsSubmissions() {
  const { store, teamId, projectId } = await setup()
  const now = Math.floor(Date.now() / 1000)
  const trashed = { teamId, projectId, status: FormStatusEnum.TRASH }
  const expiredId = await store.addForm({ ...trashed, retentionAt: now - DAY })
  const pendingId = await store.addForm({ ...trashed, retentionAt: now + DAY })
  const liveId = await store.addForm({ teamId, projectId, retentionAt: -1 })

  for (const formId of [expiredId, pendingId, liveId]) {
    store.addSubmission(formId)
  }

  const schedule = new DeleteFormInTrashSchedule(
    {
      ...store.formService,
      // The real query: in the trash, with a retention date that has passed
      findAllInTrash: async () =>
        store.forms.filter(
          form =>
            form.status === FormStatusEnum.TRASH && form.retentionAt > 0 && form.retentionAt <= now
        )
    } as any,
    store.submissionService as any
  )

  await schedule.deleteFormInTrash()

  assert.deepStrictEqual(
    store.forms.map(form => form.id),
    [pendingId, liveId]
  )
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [pendingId, liveId]
  )

  // Nothing expired: nothing to do
  await schedule.deleteFormInTrash()
  assert.strictEqual(store.forms.length, 2)
  assert.strictEqual(store.submissions.length, 2)
}

async function testTurningTheArchiveOffDeletesTheFormsSubmissions() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({ teamId, projectId, settings: { active: true } })
  const otherId = await store.addForm({ teamId, projectId })
  const resolver = new UpdateFormArchiveResolver(
    store.formService as any,
    store.submissionService as any
  )
  const { team } = await store.inForm(owner, formId)

  store.addSubmission(formId)
  store.addSubmission(otherId)

  await resolver.updateFormArchive(team, { formId, allowArchive: true })
  assert.deepStrictEqual(formOf(store, formId).settings, { active: true, allowArchive: true })
  assert.strictEqual(store.submissions.length, 2)

  await resolver.updateFormArchive(team, { formId, allowArchive: false })
  assert.deepStrictEqual(formOf(store, formId).settings, { active: true, allowArchive: false })
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [otherId]
  )
}

async function testTrashCleanupKeepsSubmissionsOfAConcurrentlyRestoredForm() {
  const { store, teamId, projectId } = await setup()
  const restoredId = await store.addForm({ teamId, projectId })
  const deletedId = await store.addForm({ teamId, projectId, status: FormStatusEnum.TRASH })

  store.addSubmission(restoredId)
  store.addSubmission(deletedId)

  const schedule = new DeleteFormInTrashSchedule(
    {
      ...store.formService,
      // Both were trashed during the scan; one was restored before deletion.
      findAllInTrash: async () => [{ id: restoredId }, { id: deletedId }]
    } as any,
    store.submissionService as any
  )

  await schedule.deleteFormInTrash()

  assert.deepStrictEqual(
    store.forms.map(form => form.id),
    [restoredId]
  )
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [restoredId]
  )
}

async function testFailedFormDeletionNeverDeletesSubmissions() {
  const failure = new Error('database unavailable')
  const formService = {
    findAllInTrash: async () => [{ id: 'expired' }],
    delete: async () => {
      throw failure
    }
  }
  const submissionService = {
    deleteAll: async () => assert.fail('Submissions must survive a failed form deletion')
  }

  await assert.rejects(
    new DeleteFormResolver(formService as any, submissionService as any).deleteForm({
      formId: 'expired'
    }),
    error => error === failure
  )
  await assert.rejects(
    new DeleteFormInTrashSchedule(formService as any, submissionService as any).deleteFormInTrash(),
    error => error === failure
  )
}

async function testFormDeletionRequiresTrashAndAnActualDeletedRow() {
  // Exercise the real persistence boundary, independently of the workspace fixture.
  for (const deletedCount of [undefined, 0, 1, 2]) {
    const calls: any[] = []
    const service = new FormService(
      {
        deleteOne: async (query: any) => {
          calls.push(['one', query])
          return { deletedCount }
        },
        deleteMany: async (query: any) => {
          calls.push(['many', query])
          return { deletedCount }
        }
      } as any,
      {} as any,
      {} as any,
      {} as any
    )

    const expected = (deletedCount ?? 0) > 0
    assert.strictEqual(await service.delete('form_1'), expected)
    assert.strictEqual(await service.delete(['form_1', 'form_2']), expected)
    assert.deepStrictEqual(calls, [
      ['one', { _id: 'form_1', status: FormStatusEnum.TRASH }],
      ['many', { _id: { $in: ['form_1', 'form_2'] }, status: FormStatusEnum.TRASH }]
    ])
  }
}

function publishSetup(store: ReturnType<typeof createWorkspaceStore>) {
  const translated: Record<string, any>[] = []
  const userUpdates: Record<string, any>[] = []
  const formService = {
    ...store.formService,
    addTranslateQueue: async (formId: string, teamId: string, userId: string, languages: any) => {
      translated.push({ formId, teamId, userId, languages })
    }
  }

  return {
    translated,
    userUpdates,
    save: new UpdateFormSchemasResolver(formService as any),
    publish: new PublishFormResolver(
      formService as any,
      {
        update: async (id: string, updates: Record<string, any>) => {
          userUpdates.push({ id, ...updates })
        }
      } as any
    )
  }
}

async function testSavedDraftsStayUnpublishedUntilPublished() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({
    teamId,
    projectId,
    fields: [],
    settings: { active: false },
    version: 0
  })
  const { save, publish, userUpdates } = publishSetup(store)
  const { team } = await store.inForm(owner, formId)
  const now = Math.floor(Date.now() / 1000)

  const saved = await save.updateFormSchemas({
    formId,
    drafts: [question, ending],
    logics,
    version: 0
  })

  assert.strictEqual(saved.version, 1)
  assert.strictEqual(saved.canPublish, true)
  assert.deepStrictEqual(
    saved.drafts.map(field => field.id),
    ['q1', 'end']
  )

  let form = formOf(store, formId)

  // Respondents still get the published form, which has no questions yet
  assert.deepStrictEqual(form.fields, [])
  assert.strictEqual(form.logics, undefined)
  assert.deepStrictEqual(form.draftLogics, logics)
  assert.strictEqual(form.settings.active, false)
  assert.strictEqual(form.version, 1)

  await publish.publishForm(team, { ...owner, hasPublishedForm: false } as any, {
    formId,
    drafts: saved.drafts,
    version: saved.version
  })
  form = formOf(store, formId)

  assert.deepStrictEqual(
    form.fields.map((field: any) => field.id),
    ['q1', 'end']
  )
  assert.strictEqual(form._drafts, JSON.stringify(form.fields))
  assert.deepStrictEqual(form.logics, logics)
  assert.strictEqual(form.settings.active, true)
  assert.ok(Math.abs(form.publishedAt - now) < 60)
  // The first form a user publishes is recorded on the user
  assert.strictEqual(userUpdates.length, 1)
  assert.strictEqual(userUpdates[0].id, owner.id)
  assert.ok(userUpdates[0].publishedFormAt > 0)

  // Saving what is published leaves nothing to publish
  const unchanged = await save.updateFormSchemas({ formId, drafts: form.fields, version: 1 })

  assert.strictEqual(unchanged.canPublish, false)
}

async function testRepublishingKeepsTheFirstPublicationDate() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({
    teamId,
    projectId,
    fields: [question, ending],
    settings: { active: false, languages: ['de', 'fr'] },
    publishedAt: 1000,
    version: 3
  })
  const { publish, translated, userUpdates } = publishSetup(store)
  const { team } = await store.inForm(owner, formId)

  await publish.publishForm(team, { ...owner, hasPublishedForm: true } as any, {
    formId,
    drafts: [question, { ...ending, title: ['Bye'] }],
    version: 3
  })

  const form = formOf(store, formId)

  assert.strictEqual(form.publishedAt, 1000)
  assert.ok(form.fieldsUpdatedAt > 1000)
  assert.deepStrictEqual(form.fields[1].title, ['Bye'])
  // Publishing reopens the form, and its translations follow the new content
  assert.strictEqual(form.settings.active, true)
  assert.deepStrictEqual(translated, [
    { formId, teamId, userId: owner.id, languages: ['de', 'fr'] }
  ])
  assert.deepStrictEqual(userUpdates, [])
}

// Two tabs of the builder: the one that saved last holds the newer version, and the other
// must not overwrite it
async function testStaleBuilderCannotSaveOrPublish() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({
    teamId,
    projectId,
    fields: [question, ending],
    _drafts: JSON.stringify([question, ending]),
    settings: { active: false },
    version: 5
  })
  const { save, publish } = publishSetup(store)
  const { team } = await store.inForm(owner, formId)
  const before = JSON.stringify(formOf(store, formId))
  const stale = { formId, drafts: [ending], version: 4 }
  const isStale = (error: any) => error.response?.error === 'invalid_draft_version'

  await assert.rejects(save.updateFormSchemas(stale), isStale)
  await assert.rejects(publish.publishForm(team, owner as any, stale), isStale)
  assert.strictEqual(JSON.stringify(formOf(store, formId)), before)

  assert.strictEqual((await save.updateFormSchemas({ ...stale, version: 5 })).version, 6)
}

async function testLogicEditsAreDraftsToo() {
  const { store, owner, teamId, projectId } = await setup()
  const formId = await store.addForm({ teamId, projectId, logics })

  await store.inForm(owner, formId)
  await new UpdateFormLogicsResolver(store.formService as any).updateFormLogics({
    formId,
    logics: []
  })

  assert.deepStrictEqual(formOf(store, formId).draftLogics, [])
  assert.deepStrictEqual(formOf(store, formId).logics, logics)
}

async function testFormListIsPerProjectAndStatus() {
  const { store, owner, teamId, projectId } = await setup()
  const otherProjectId = await store.addProject(teamId, owner, 'Other')
  const liveId = await store.addForm({ teamId, projectId, name: 'Feedback' })
  const unnamedId = await store.addForm({ teamId, projectId, name: '' })
  const trashedId = await store.addForm({ teamId, projectId, status: FormStatusEnum.TRASH })

  await store.addForm({ teamId, projectId: otherProjectId })
  store.addSubmission(liveId)
  store.addSubmission(liveId)
  store.addSubmission(trashedId)

  const resolver = new FormsResolver(store.formService as any, store.submissionService as any)

  await store.inProject(owner, projectId)

  const forms: any[] = await resolver.forms({ projectId, status: FormStatusEnum.NORMAL })

  assert.deepStrictEqual(
    forms.map(form => [form.id, form.name, form.submissionCount]),
    [
      [liveId, 'Feedback', 2],
      [unnamedId, 'Untitled', 0]
    ]
  )
  assert.strictEqual(typeof forms[0].updatedAt, 'number')

  const trash: any[] = await resolver.forms({ projectId, status: FormStatusEnum.TRASH })

  assert.deepStrictEqual(
    trash.map(form => [form.id, form.submissionCount]),
    [[trashedId, 1]]
  )
  assert.deepStrictEqual(
    (await resolver.forms({ projectId, status: FormStatusEnum.NORMAL, keyword: 'feed' })).map(
      form => form.id
    ),
    [liveId]
  )
  assert.deepStrictEqual(
    await resolver.forms({ projectId: 'missing', status: FormStatusEnum.NORMAL }),
    []
  )
}

async function testFormIsOutOfReachOutsideItsProject() {
  const { store, owner, collaborator, teamId, projectId } = await setup()
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const formId = await store.addForm({ teamId, projectId: privateProjectId })
  const sharedFormId = await store.addForm({ teamId, projectId })

  // In the workspace, not in the form's project
  await assert.rejects(store.inForm(collaborator, formId), /permission to access/)
  await assert.rejects(store.inForm(collaborator, 'missing'), /permission to access this form/)

  const access = await store.inForm(collaborator, sharedFormId)

  assert.strictEqual(access.form.id, sharedFormId)
  assert.strictEqual(access.project.id, projectId)
  assert.strictEqual(access.team.id, teamId)
}

async function run() {
  await testNewFormIsAnUnpublishedDraft()
  await testFormWithoutANameIsUntitled()
  await testDuplicateIsAnUnpublishedCopyOfTheCallers()
  await testDuplicateOfAFormWithoutDraftsStartsFromThePublishedFields()
  await testFormOnlyMovesToAProjectOfTheCallerInTheSameWorkspace()
  await testTrashedFormClosesAndCanBeRestored()
  await testDeletingATrashedFormTakesItsSubmissions()
  await testDeletingALiveFormKeepsItsSubmissions()
  await testExpiredTrashIsDeletedWithItsSubmissions()
  await testTrashCleanupKeepsSubmissionsOfAConcurrentlyRestoredForm()
  await testFailedFormDeletionNeverDeletesSubmissions()
  await testFormDeletionRequiresTrashAndAnActualDeletedRow()
  await testTurningTheArchiveOffDeletesTheFormsSubmissions()
  await testSavedDraftsStayUnpublishedUntilPublished()
  await testRepublishingKeepsTheFirstPublicationDate()
  await testStaleBuilderCannotSaveOrPublish()
  await testLogicEditsAreDraftsToo()
  await testFormListIsPerProjectAndStatus()
  await testFormIsOutOfReachOutsideItsProject()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
