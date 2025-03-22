export const SIGN_UP = `query signUp($input: SignUpInput!) {
  signUp(input: $input)
}`

export const LOGIN = `query login($input: LoginInput!) {
  login(input: $input)
}`

export const CREATE_TEAM = `mutation createTeam($input: CreateTeamInput!) {
  createTeam(input: $input)
}`

export const JOIN_TEAM = `mutation joinTeam($input: JoinTeamInput!) {
  joinTeam(input: $input)
}`

export const DISSOLVE_TEAM = `mutation dissolveTeam($input: DissolveTeamInput!) {
  dissolveTeam(input: $input)
}`

export const TEAMS = `query teams{
  teams {
    id
    name
    ownerId
    avatar
    projects {
      id
      teamId
      name
      ownerId
      isOwner
    }
    plan {
      id
      name
      memberLimit
      storageLimit
      apiAccessLimit
    }
    subscription {
      planId
      billingCycle
      startAt
      endAt
      canceledAt
      status
    }
    inviteCode
    role
    isOwner
    createdAt
  }
}`

export const PUBLIC_TEAM_DETAIL = `query publicTeamDetail($input: PublicTeamDetailInput!) {
  publicTeamDetail(input: $input) {
    id
    name
    avatar
    allowJoinByInviteLink
    memberCount
    owner {
      name
      avatar
    }
  }
}`

export const TEAM_MEMBERS = `query teamMembers($input: TeamDetailInput!) {
  teamMembers(input: $input){
    id
    name
    email
    avatar
    isOwner
  }
}`

export const UPDATE_TEAM_SETTINGS = `mutation updateTeam($input: UpdateTeamInput!) {
  updateTeam(input: $input)
}`

export const PROJECTS = `query projects($input: TeamDetailInput!) {
  projects(input: $input){
    id
    teamId
    name
    icon
    ownerId
    isOwner
  }
}`

export const PROJECT_MEMBERS = `query projectMembers($input: ProjectDetailInput!) {
  projectMembers(input: $input){
    id
    name
    email
    avatar
  }
}`

export const ADD_PROJECT_MEMBER = `mutation addProjectMember($input: ProjectMemberInput!) {
  addProjectMember(input: $input)
}`

export const DELETE_PROJECT_MEMBER = `mutation deleteProjectMember($input: ProjectMemberInput!) {
  deleteProjectMember(input: $input)
}`

export const CREATE_PROJECT = `mutation createProject($input: CreateProjectInput!) {
  createProject(input: $input)
}`

export const RENAME_PROJECT = `mutation renameProject($input: RenameProjectInput!) {
  renameProject(input: $input)
}`

export const DELETE_PROJECT = `mutation deleteProject($input: DeleteProjectInput!) {
  deleteProject(input: $input)
}`

export const CREATE_FORM = `mutation createForm($input: CreateFormInput!) {
  createForm(input: $input)
}`

export const DUPLICATE_FORM = `mutation duplicateForm($input: FormDetailInput!) {
  duplicateForm(input: $input)
}`

export const FORMS = `query forms($input: FormsInput!) {
  forms(input: $input) {
    id
    teamId
    projectId
    memberId
    name
    interactiveMode
    kind
    submissionCount
    settings {
      active
      published
    }
    retentionAt
    status
  }
}`

export const FORM_DETAIL = `query formDetail($input: FormDetailInput!) {
  formDetail(input: $input) {
    id
    teamId
    memberId
    name
    description
    interactiveMode
    kind
    settings {
      captchaKind
      active
      filterSpam
      published
      allowArchive
      password
      requirePassword
      redirectOnCompletion
      redirectUrl
    }
    fields {
      id
      title
      description
      kind
      validations
      properties
      width
      hide
      frozen
    }
    fieldUpdateAt
    themeSettings {
      theme
    }
    retentionAt
    suspended
    draft
    status
  }
}`

export const UPDATE_FORM_FIELDS = `mutation updateFormSchemas($input: UpdateFormSchemasInput!) {
  updateFormSchemas(input: $input)
}`

export const UPDATE_FORM_FIELD = `mutation updateFormField($input: UpdateFormFieldInput!) {
    updateFormField(input: $input)
  }`

export const UPDATE_FORM = `mutation($input: UpdateFormInput!) {
  updateForm(input: $input)
}`

export const UPDATE_FORM_LOGICS = `mutation($input: UpdateFormLogicsInput!) {
  updateFormLogics(input: $input)
}`

export const UPDATE_FORM_VARIABLES = `mutation($input: UpdateFormVariablesInput!) {
  updateFormVariables(input: $input)
}`

export const MOVE_FORM_TO_TRASH = `mutation moveFormToTrash($input: FormDetailInput!) {
  moveFormToTrash(input: $input)
}`

export const DELETE_FORM = `mutation deleteForm($input: FormDetailInput!) {
  deleteForm(input: $input)
}`

export const APPS = `query apps {
  apps {
    id
    internalType
    uniqueId
    category
    name
    description
    avatar
    homepage
    helpLinkUrl
    status
  }
}`

export const APP_DETAIL = `query appDetail($input: AppDetailInput!) {
  appDetail(input: $input) {
    id
    name
    description
    avatar
    homepage
    uniqueId
    status
  }
}`

export const APP_AUTHORIZE_URL = `query appAuthorizeUrl($input: AppAuthorizeUrlInput!) {
  appAuthorizeUrl(input: $input)
}`

export const OPEN_FORM = `query openForm($input: OpenFormInput!) {
  openForm(input: $input)
}`

export const VERIFY_FORM_PASSWORD = `query verifyFormPassword($input: VerifyPasswordInput!) {
  verifyFormPassword(input: $input)
}`

export const UPLOAD_FILE_TOKEN = `mutation uploadFileToken($input: UploadFormFileInput!) {
  uploadFileToken(input: $input) {
    token
    urlPrefix
    key
  }
}`

export const COMPLETE_SUBMISSION = `mutation completeSubmission($input: CompleteSubmissionInput!) {
	completeSubmission(input: $input) {
	  clientSecret 
	}
}`

export const SUBMISSIONS = `query submissions($input: SubmissionsInput!) {
  submissions(input: $input) {
    total
    submissions {
      id
      category
      title
      answers
      endAt
    }
  }
}`
