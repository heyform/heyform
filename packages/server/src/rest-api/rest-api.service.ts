import {
  CaptchaKindEnum,
  FieldKindEnum,
  FormStatusEnum,
  SubmissionCategoryEnum,
  SubmissionStatusEnum
} from '@heyform-inc/shared-types-enums'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { isEmail } from 'class-validator'

import {
  FormService,
  ProjectService,
  SubmissionService,
  TeamMemberService,
  TeamService,
  UserService
} from '../service'
import { ApiKeyScope } from './api-key.service'
import { ApiPrincipal } from './rest-api-key.guard'
import { BCRYPT_SALT } from '@environments'
import {
  ValidateError,
  fieldsToValidateRules,
  flattenFields,
  validate
} from '@heyform-inc/answer-utils'
import { helper, nanoid, timestamp } from '@heyform-inc/utils'
import { isTeamOwner } from '@model'
import {
  assertValidChoiceBranching,
  assertValidChoiceMatrices,
  assertValidFormNavigation,
  isSafeCSSValue,
  isSafeCustomCSS,
  passwordHash,
  sanitizeFormDrafts
} from '@utils'
import { assertSafeSpecialFieldAnswers } from '@utils'

function requireScope(
  principal: ApiPrincipal | undefined,
  scope: ApiKeyScope,
  workspaceId?: string,
  projectId?: string
) {
  if (!principal) throw new ForbiddenException()

  const workspace = principal.workspaces.get(workspaceId)
  if (
    !principal.scopes.includes(scope) ||
    (workspaceId && !workspace?.scopes.includes(scope)) ||
    (projectId && !workspace?.projectIds.has(projectId))
  ) {
    throw new ForbiddenException()
  }
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    throw new BadRequestException('Invalid identifier')
  return value
}
function validName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100)
    throw new BadRequestException('Invalid name')
  return value.trim()
}
@Injectable()
export class RestApiService {
  constructor(
    private readonly teams: TeamService,
    private readonly teamMembers: TeamMemberService,
    private readonly users: UserService,
    private readonly projects: ProjectService,
    private readonly forms: FormService,
    private readonly submissions: SubmissionService
  ) {}
  async workspaces(principal: ApiPrincipal) {
    requireScope(principal, 'workspaces:read')
    const rows = await this.teams.findAllBy({
      _id: { $in: [...principal.workspaces.keys()] }
    })
    return rows.filter(Boolean).map(t => ({ id: t.id, name: t.name, ownerId: t.ownerId }))
  }
  async listProjects(principal: ApiPrincipal, id: string) {
    requireScope(principal, 'projects:read', id)
    if (!(await this.teams.findById(identifier(id)))) throw new NotFoundException()
    const projects = await this.projects.findByIds([...principal.workspaces.get(id).projectIds], {
      teamId: id
    })
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      workspaceId: p.teamId,
      ownerId: p.ownerId
    }))
  }
  private async canReadUser(principal: ApiPrincipal, userId: string) {
    const memberships = await this.teams.findMemberRelationInTeams(userId, [
      ...principal.workspaces.keys()
    ])
    return memberships.length > 0
  }
  async getCurrentUser(principal: ApiPrincipal) {
    const user = await this.users.findById(principal.userId)
    if (!user) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  async getWorkspace(principal: ApiPrincipal, id: string) {
    requireScope(principal, 'workspaces:read', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    return { id: team.id, name: team.name, ownerId: team.ownerId }
  }
  async updateWorkspace(principal: ApiPrincipal, id: string, body: any) {
    requireScope(principal, 'workspaces:write', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    const name = validName(body?.name)
    await this.teams.update(id, { name })
    return { id, name, ownerId: team.ownerId }
  }
  async getUser(principal: ApiPrincipal, id: string) {
    requireScope(principal, 'users:read')
    const user = await this.users.findById(identifier(id))
    if (!user || !(await this.canReadUser(principal, id))) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  async createProject(principal: ApiPrincipal, id: string, body: any) {
    requireScope(principal, 'projects:write', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    const name = validName(body?.name)
    const ownerId = principal.userId
    const projectId = await this.projects.create({ teamId: id, name, ownerId })
    try {
      await this.projects.createMember({ projectId, memberId: ownerId })
    } catch (error) {
      await this.projects.deleteAllMemberInProject(projectId)
      await this.projects.delete(projectId)
      throw error
    }
    return { id: projectId, name, workspaceId: id, ownerId }
  }
  async listMembers(principal: ApiPrincipal, id: string) {
    requireScope(principal, 'members:read', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    return (await this.teams.findMembersInTeam(id)).map(m => ({
      userId: m.memberId,
      role: m.role,
      isOwner: isTeamOwner(team, m.memberId)
    }))
  }
  async inviteMembers(principal: ApiPrincipal, id: string, body: any) {
    requireScope(principal, 'members:write', id)
    const emails = body?.emails
    if (
      !Array.isArray(emails) ||
      emails.length < 1 ||
      emails.length > 20 ||
      !emails.every(email => typeof email === 'string' && isEmail(email.trim()))
    )
      throw new BadRequestException('Invalid emails')
    const team = await this.teams.findById(identifier(id))
    const user = await this.users.findById(principal.userId)
    if (!team || !user) throw new NotFoundException()
    return { workspaceId: id, emails: await this.teamMembers.invite(team, user, emails) }
  }
  async removeMember(principal: ApiPrincipal, id: string, userId: string) {
    requireScope(principal, 'members:write', id)
    const team = await this.teams.findById(identifier(id))
    const member = await this.teams.findMemberById(id, identifier(userId))
    if (!team || !member) throw new NotFoundException()
    if (isTeamOwner(team, userId)) throw new ForbiddenException('Cannot remove a workspace owner')
    await this.teamMembers.remove(id, userId, principal.userId)
    return { removed: true, workspaceId: id, userId }
  }
  async renameProject(principal: ApiPrincipal, id: string, body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(principal, 'projects:write', project.teamId, project.id)
    const name = validName(body?.name)
    await this.projects.update(id, { name })
    return { id, name }
  }
  async listForms(principal: ApiPrincipal, id: string) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(principal, 'forms:read', project.teamId, project.id)
    return (await this.forms.findAll(id, FormStatusEnum.NORMAL)).map(f => ({
      id: f.id,
      name: f.name,
      version: f.version,
      publishedAt: f.publishedAt
    }))
  }
  async createForm(principal: ApiPrincipal, id: string, body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(principal, 'forms:write', project.teamId, project.id)
    const name = validName(body?.name)
    const drafts = [
      {
        id: nanoid(12),
        title: null,
        description: null,
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: false }
      },
      { id: nanoid(12), title: ['Thank you!'], kind: FieldKindEnum.THANK_YOU }
    ]
    const memberId = principal.userId
    const formId = await this.forms.create({
      name,
      teamId: project.teamId,
      projectId: id,
      memberId,
      fields: [],
      _drafts: JSON.stringify(drafts),
      fieldsUpdatedAt: 0,
      hiddenFields: [],
      version: 0,
      status: FormStatusEnum.NORMAL,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true,
        enableEmailNotification: true
      }
    })
    return { id: formId, name, projectId: id, workspaceId: project.teamId }
  }
  async renameForm(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    const name = validName(body?.name)
    await this.forms.update(id, { name })
    return { id, name }
  }
  async duplicateForm(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const name = validName(body?.name)
    const project = await this.projects.findById(form.projectId)
    if (!project || project.teamId !== form.teamId)
      throw new ConflictException('Invalid source project')
    const copy: any = {}
    for (const field of [
      'variables',
      'logics',
      'draftLogics',
      'translations',
      'hiddenFields',
      '_drafts',
      'kind',
      'interactiveMode',
      'themeSettings'
    ]) {
      const value = form.get(field)
      if (value !== undefined) copy[field] = value
    }
    const settings = form.settings ? JSON.parse(JSON.stringify(form.settings)) : {}
    delete settings.password
    const memberId = principal.userId
    const formId = await this.forms.create({
      ...copy,
      name,
      teamId: form.teamId,
      projectId: project.id,
      memberId,
      fields: [],
      _drafts: copy._drafts || JSON.stringify(form.fields || []),
      fieldsUpdatedAt: 0,
      version: 0,
      status: FormStatusEnum.NORMAL,
      settings: { ...settings, active: false, requirePassword: false }
    })
    return { id: formId, name, projectId: project.id, workspaceId: form.teamId, active: false }
  }
  async moveForm(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const project = await this.projects.findById(identifier(body?.targetProjectId))
    if (!project) throw new NotFoundException()
    if (project.teamId !== form.teamId)
      throw new ForbiddenException('Cross-workspace movement is not permitted')
    requireScope(principal, 'forms:write', project.teamId, project.id)
    await this.forms.update(id, { projectId: project.id })
    return { id, projectId: project.id, workspaceId: form.teamId }
  }
  private async editableForm(principal: ApiPrincipal, id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    return form
  }
  async updateHiddenFields(principal: ApiPrincipal, id: string, body: any) {
    await this.editableForm(principal, id)
    if (!Array.isArray(body?.hiddenFields) || body.hiddenFields.length > 200)
      throw new BadRequestException('Invalid hidden fields')
    const hiddenFields = body.hiddenFields.map((f: any) => ({
      id: identifier(f?.id),
      name: validName(f?.name)
    }))
    if (
      new Set(hiddenFields.map(f => f.id)).size !== hiddenFields.length ||
      new Set(hiddenFields.map(f => f.name)).size !== hiddenFields.length
    )
      throw new BadRequestException('Duplicate hidden fields')
    await this.forms.update(id, { hiddenFields })
    return { id, hiddenFields }
  }
  async updateVariables(principal: ApiPrincipal, id: string, body: any) {
    await this.editableForm(principal, id)
    if (!Array.isArray(body?.variables) || body.variables.length > 200)
      throw new BadRequestException('Invalid variables')
    const variables = body.variables.map((v: any) => {
      if (
        !v ||
        !['string', 'number'].includes(v.kind) ||
        typeof v.value !== v.kind ||
        (v.kind === 'number' && !Number.isFinite(v.value))
      )
        throw new BadRequestException('Invalid variable')
      return { id: identifier(v.id), name: validName(v.name), kind: v.kind, value: v.value }
    })
    if (new Set(variables.map(v => v.id)).size !== variables.length)
      throw new BadRequestException('Duplicate variables')
    await this.forms.update(id, { variables })
    return { id, variables }
  }
  async updateSettings(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.editableForm(principal, id)
    const booleans = [
      'enableExpirationDate',
      'enableTimeLimit',
      'filterSpam',
      'generatePseudonymId',
      'enableQuotaLimit',
      'enableIpLimit',
      'displayIpAddress',
      'enableProgress',
      'enableQuestionList',
      'enableNavigationArrows',
      'openLinksInNewTab',
      'enableClosedMessage',
      'allowArchive',
      'requirePassword',
      'enableEmailNotification',
      'redirectOnCompletion'
    ]
    const numbers = [
      'enabledAt',
      'closedAt',
      'timeLimit',
      'quotaLimit',
      'ipLimitCount',
      'ipLimitTime',
      'redirectDelay'
    ]
    const strings = [
      'expirationTimeZone',
      'locale',
      'closedFormTitle',
      'closedFormDescription',
      'metaTitle',
      'metaDescription',
      'redirectUrl',
      'metaOGImageUrl'
    ]
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length)
      throw new BadRequestException('Settings required')
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (booleans.includes(key) && typeof value === 'boolean') updates['settings.' + key] = value
      else if (
        numbers.includes(key) &&
        typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= (['quotaLimit', 'ipLimitCount'].includes(key) ? 1 : 0)
      )
        updates['settings.' + key] = value
      else if (strings.includes(key) && typeof value === 'string') {
        if (['redirectUrl', 'metaOGImageUrl'].includes(key)) {
          try {
            if (!['http:', 'https:'].includes(new URL(value).protocol)) throw new Error()
          } catch {
            throw new BadRequestException('Invalid URL')
          }
        }
        updates['settings.' + key] = value
      } else if (
        key === 'password' &&
        typeof value === 'string' &&
        value.length >= 1 &&
        value.length <= 72
      )
        updates['settings.password'] = await passwordHash(value, BCRYPT_SALT)
      else throw new BadRequestException('Invalid or unsupported setting: ' + key)
    }
    if (body.requirePassword === true && !updates['settings.password'] && !form.settings?.password)
      throw new BadRequestException('Password required')
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  async updateTheme(principal: ApiPrincipal, id: string, body: any) {
    await this.editableForm(principal, id)
    const theme = body?.theme
    if (!theme || typeof theme !== 'object' || Array.isArray(theme))
      throw new BadRequestException('Theme required')
    const allowed = [
      'fontFamily',
      'questionTextColor',
      'answerTextColor',
      'buttonBackground',
      'buttonTextColor',
      'backgroundColor',
      'backgroundImage',
      'backgroundBrightness',
      'customCSS'
    ]
    for (const [key, value] of Object.entries(theme)) {
      if (
        !allowed.includes(key) ||
        (key === 'backgroundBrightness'
          ? typeof value !== 'number' || !Number.isFinite(value) || value < -100 || value > 100
          : typeof value !== 'string' ||
            !(key === 'customCSS' ? isSafeCustomCSS(value) : isSafeCSSValue(value)))
      )
        throw new BadRequestException('Invalid theme property: ' + key)
    }
    const updates: Record<string, any> = { 'themeSettings.theme': theme }
    for (const key of ['logo', 'favicon']) {
      if (body[key] === undefined) continue
      if (body[key] !== null) {
        try {
          if (
            typeof body[key] !== 'string' ||
            !['http:', 'https:'].includes(new URL(body[key]).protocol)
          )
            throw new Error()
        } catch {
          throw new BadRequestException('Invalid image URL')
        }
      }
      updates['themeSettings.' + key] = body[key]
    }
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  async trashForm(principal: ApiPrincipal, id: string) {
    await this.editableForm(principal, id)
    await this.forms.update(id, {
      retentionAt: timestamp() + 30 * 86400,
      'settings.active': false,
      status: FormStatusEnum.TRASH
    })
    return { id, trashed: true }
  }
  async restoreForm(principal: ApiPrincipal, id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.TRASH) throw new ConflictException('Form is not in trash')
    await this.forms.update(id, {
      retentionAt: -1,
      status: FormStatusEnum.NORMAL,
      'settings.active': false
    })
    return { id, restored: true }
  }
  async updateDrafts(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (
      form.status !== FormStatusEnum.NORMAL ||
      !Number.isSafeInteger(body?.version) ||
      body.version !== form.version
    )
      throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics)))
      throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    assertValidChoiceMatrices(drafts)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    await this.forms.update(id, {
      _drafts: JSON.stringify(drafts),
      draftLogics: logics,
      fieldsUpdatedAt: timestamp(),
      version: body.version + 1
    })
    return { id, drafts, version: body.version + 1 }
  }
  async publishForm(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (
      form.status !== FormStatusEnum.NORMAL ||
      !Number.isSafeInteger(body?.version) ||
      body.version !== form.version
    )
      throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics)))
      throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    assertValidChoiceMatrices(drafts, true)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    const now = timestamp()
    const updates: Record<string, any> = {
      fields: drafts,
      logics,
      draftLogics: logics,
      _drafts: JSON.stringify(drafts),
      fieldsUpdatedAt: now,
      version: body.version,
      'settings.active': true
    }
    if (!form.publishedAt) updates.publishedAt = now
    const user = await this.users.findById(principal.userId)
    if (!user) throw new NotFoundException()
    if (helper.isValidArray(form.settings?.languages)) {
      await this.forms.addTranslateQueue(id, form.teamId, user.id, form.settings!.languages)
    }
    if (!user.hasPublishedForm) await this.users.update(user.id, { publishedFormAt: now })
    await this.forms.update(id, updates)
    return {
      id,
      active: true,
      version: body.version,
      publishedAt: updates.publishedAt ?? form.publishedAt
    }
  }
  async unpublishForm(principal: ApiPrincipal, id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    await this.forms.update(id, { 'settings.active': false })
    return { id, active: false }
  }
  async setFormAvailability(principal: ApiPrincipal, id: string, body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.active !== 'boolean'
    ) {
      throw new BadRequestException('active must be a boolean')
    }
    if (body.active && !form.publishedAt) throw new ConflictException('Form has not been published')
    await this.forms.update(id, { 'settings.active': body.active })
    return { id, active: body.active }
  }
  private async submissionForm(principal: ApiPrincipal, id: string, scope: ApiKeyScope) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, scope, form.teamId, form.projectId)
    return form
  }
  async getSubmission(principal: ApiPrincipal, id: string, submissionId: string) {
    await this.submissionForm(principal, id, 'submissions:read')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId))
      throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    return {
      id: row.id,
      formId: row.formId,
      category: row.category,
      title: row.title,
      answers: row.answers,
      hiddenFields: row.hiddenFields,
      variables: row.variables,
      startAt: row.startAt,
      endAt: row.endAt,
      pseudonymId: row.pseudonymId
    }
  }
  async updateSubmissionCategory(
    principal: ApiPrincipal,
    id: string,
    submissionId: string,
    body: any
  ) {
    await this.submissionForm(principal, id, 'submissions:write')
    const category = body?.category
    if (
      !/^[a-fA-F0-9]{24}$/.test(submissionId) ||
      typeof category !== 'string' ||
      !Object.values(SubmissionCategoryEnum).includes(category as SubmissionCategoryEnum)
    )
      throw new BadRequestException('Invalid submission ID or category')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    if (
      !(await this.submissions.updateCategory({
        formId: id,
        submissionIds: [submissionId],
        category: category as SubmissionCategoryEnum
      }))
    )
      throw new NotFoundException()
    return { id: submissionId, category }
  }
  async editSubmissionAnswer(principal: ApiPrincipal, id: string, submissionId: string, body: any) {
    const form = await this.submissionForm(principal, id, 'submissions:write')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId))
      throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    const rule = fieldsToValidateRules(flattenFields(form.fields, true)).find(
      r => r.id === body?.fieldId
    )
    if (!rule || !Object.prototype.hasOwnProperty.call(body, 'value'))
      throw new BadRequestException('Invalid field or missing value')
    try {
      assertSafeSpecialFieldAnswers([rule], { [rule.id]: body.value })
      validate(rule, body.value)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (error instanceof ValidateError) throw new BadRequestException(error.response)
      throw error
    }
    const answer = {
      id: rule.id,
      kind: rule.kind,
      properties: rule.properties || {},
      title: rule.title,
      value: body.value
    }
    const updated = row.answers.some(a => a.id === rule.id)
      ? await this.submissions.updateAnswer(submissionId, answer)
      : await this.submissions.createAnswer(submissionId, answer)
    if (!updated) throw new ConflictException('Answer update failed')
    return { id: submissionId, updated: true }
  }
  async listSubmissions(principal: ApiPrincipal, id: string, page = 1, limit = 30) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'submissions:read', form.teamId, form.projectId)
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 1000000 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new BadRequestException('Invalid pagination')
    const total = await this.submissions.count({ formId: id })
    const submissions = await this.submissions.findAll({
      formId: id,
      page,
      limit,
      withIp: false
    })
    return {
      total,
      page,
      limit,
      submissions: submissions.map(submission => ({ ...submission.toJSON(), id: submission.id }))
    }
  }
  async getForm(principal: ApiPrincipal, id: string) {
    requireScope(principal, 'forms:read')
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(principal, 'forms:read', form.teamId, form.projectId)
    return {
      id: form.id,
      name: form.name,
      workspaceId: form.teamId,
      projectId: form.projectId,
      fields: form.fields,
      drafts: form.get('drafts'),
      hiddenFields: form.hiddenFields,
      variables: form.variables,
      logics: form.logics,
      draftLogics: form.draftLogics,
      themeSettings: form.themeSettings,
      status: form.status,
      active: form.settings?.active,
      version: form.version,
      publishedAt: form.publishedAt
    }
  }
}
