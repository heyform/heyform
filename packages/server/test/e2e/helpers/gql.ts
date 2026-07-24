/**
 * GraphQL operations mirrored from the webapp (packages/webapp/src/consts/gql.ts)
 * so the e2e tests exercise the same surface the frontend uses.
 *
 * Trimmed to fields the suites actually assert against; keep this list aligned
 * with the suites in this directory.
 */

// ── Auth ────────────────────────────────────────────────────────────────────
export const SIGN_UP_GQL = /* GraphQL */ `
  mutation signUp($input: SignUpInput!) {
    signUp(input: $input)
  }
`

export const LOGIN_GQL = /* GraphQL */ `
  query login($input: LoginInput!) {
    login(input: $input)
  }
`

// ── User ────────────────────────────────────────────────────────────────────
export const USER_DETAIL_GQL = /* GraphQL */ `
  query userDetail {
    userDetail {
      id
      name
      email
      isEmailVerified
    }
  }
`

export const UPDATE_USER_GQL = /* GraphQL */ `
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input)
  }
`

export const UPDATE_USER_PASSWORD_GQL = /* GraphQL */ `
  mutation updateUserPassword($input: UpdateUserPasswordInput!) {
    updateUserPassword(input: $input)
  }
`

export const SEND_RESET_EMAIL_GQL = /* GraphQL */ `
  mutation sendResetPasswordEmail($input: SendResetPasswordEmailInput!) {
    sendResetPasswordEmail(input: $input)
  }
`

export const RESET_PASSWORD_GQL = /* GraphQL */ `
  mutation resetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`

// ── Team / Workspace ────────────────────────────────────────────────────────
export const CREATE_TEAM_GQL = /* GraphQL */ `
  mutation createTeam($input: CreateTeamInput!) {
    createTeam(input: $input)
  }
`

export const TEAMS_GQL = /* GraphQL */ `
  query teams {
    teams {
      id
      name
      ownerId
      isOwner
      inviteCode
      projects {
        id
        name
        teamId
      }
    }
  }
`

export const TEAM_MEMBERS_GQL = /* GraphQL */ `
  query teamMembers($input: TeamDetailInput!) {
    teamMembers(input: $input) {
      id
      name
      email
      role
      isOwner
    }
  }
`

export const TEAM_OVERVIEW_GQL = /* GraphQL */ `
  query teamOverview($input: TeamDetailInput!) {
    teamOverview(input: $input) {
      memberCount
      formCount
      submissionQuota
      storageQuota
    }
  }
`

export const TEAM_RECENT_FORMS_GQL = /* GraphQL */ `
  query teamRecentForms($input: RecentFormsInput!) {
    teamRecentForms(input: $input) {
      id
      name
    }
  }
`

export const PUBLIC_TEAM_DETAIL_GQL = /* GraphQL */ `
  query publicTeamDetail($input: PublicTeamDetailInput!) {
    publicTeamDetail(input: $input) {
      id
      name
      allowJoinByInviteLink
    }
  }
`

export const UPDATE_TEAM_GQL = /* GraphQL */ `
  mutation updateTeam($input: UpdateTeamInput!) {
    updateTeam(input: $input)
  }
`

export const INVITE_MEMBER_GQL = /* GraphQL */ `
  mutation inviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input)
  }
`

export const REMOVE_TEAM_MEMBER_GQL = /* GraphQL */ `
  mutation removeTeamMember($input: TransferTeamInput!) {
    removeTeamMember(input: $input)
  }
`

export const RESET_TEAM_INVITE_CODE_GQL = /* GraphQL */ `
  mutation resetTeamInviteCode($input: TeamDetailInput!) {
    resetTeamInviteCode(input: $input)
  }
`

export const SEARCH_TEAM_GQL = /* GraphQL */ `
  query searchTeam($input: SearchTeamInput!) {
    searchTeam(input: $input) {
      forms {
        id
        name
      }
    }
  }
`

export const CREATE_BRAND_KIT_GQL = /* GraphQL */ `
  mutation createBrandKit($input: CreateBrandKitInput!) {
    createBrandKit(input: $input)
  }
`

export const JOIN_TEAM_GQL = /* GraphQL */ `
  mutation joinTeam($input: JoinTeamInput!) {
    joinTeam(input: $input)
  }
`

export const LEAVE_TEAM_GQL = /* GraphQL */ `
  mutation leaveTeam($input: TeamDetailInput!) {
    leaveTeam(input: $input)
  }
`

export const TRANSFER_TEAM_GQL = /* GraphQL */ `
  mutation transferTeam($input: TransferTeamInput!) {
    transferTeam(input: $input)
  }
`

export const DISSOLVE_TEAM_CODE_GQL = /* GraphQL */ `
  query dissolveTeamCode($input: TeamDetailInput!) {
    dissolveTeamCode(input: $input)
  }
`

export const DISSOLVE_TEAM_GQL = /* GraphQL */ `
  mutation dissolveTeam($input: DissolveTeamInput!) {
    dissolveTeam(input: $input)
  }
`

// ── Project ─────────────────────────────────────────────────────────────────
export const CREATE_PROJECT_GQL = /* GraphQL */ `
  mutation createProject($input: CreateProjectInput!) {
    createProject(input: $input)
  }
`

export const RENAME_PROJECT_GQL = /* GraphQL */ `
  mutation renameProject($input: RenameProjectInput!) {
    renameProject(input: $input)
  }
`

export const ADD_PROJECT_MEMBER_GQL = /* GraphQL */ `
  mutation addProjectMember($input: ProjectMemberInput!) {
    addProjectMember(input: $input)
  }
`

export const DELETE_PROJECT_MEMBER_GQL = /* GraphQL */ `
  mutation deleteProjectMember($input: ProjectMemberInput!) {
    deleteProjectMember(input: $input)
  }
`

export const LEAVE_PROJECT_GQL = /* GraphQL */ `
  mutation leaveProject($input: ProjectDetailInput!) {
    leaveProject(input: $input)
  }
`

export const DELETE_PROJECT_CODE_GQL = /* GraphQL */ `
  query deleteProjectCode($input: ProjectDetailInput!) {
    deleteProjectCode(input: $input)
  }
`

export const DELETE_PROJECT_GQL = /* GraphQL */ `
  mutation deleteProject($input: DeleteProjectInput!) {
    deleteProject(input: $input)
  }
`

// ── Form ────────────────────────────────────────────────────────────────────
export const CREATE_FORM_GQL = /* GraphQL */ `
  mutation createForm($input: CreateFormInput!) {
    createForm(input: $input)
  }
`

export const FORMS_GQL = /* GraphQL */ `
  query forms($input: FormsInput!) {
    forms(input: $input) {
      id
      name
      teamId
      projectId
      status
    }
  }
`

export const FORM_DETAIL_GQL = /* GraphQL */ `
  query formDetail($input: FormDetailInput!) {
    formDetail(input: $input) {
      id
      name
      teamId
      version
      isDraft
      canPublish
      settings {
        active
      }
      drafts {
        id
        kind
        title
      }
    }
  }
`

export const UPDATE_FORM_SCHEMAS_GQL = /* GraphQL */ `
  mutation updateFormSchemas($input: UpdateFormSchemasInput!) {
    updateFormSchemas(input: $input) {
      version
      drafts {
        id
        kind
        title
      }
      canPublish
    }
  }
`

export const PUBLISH_FORM_GQL = /* GraphQL */ `
  mutation publishForm($input: UpdateFormSchemasInput!) {
    publishForm(input: $input)
  }
`

export const UPDATE_FORM_GQL = /* GraphQL */ `
  mutation updateForm($input: UpdateFormInput!) {
    updateForm(input: $input)
  }
`

export const DUPLICATE_FORM_GQL = /* GraphQL */ `
  mutation duplicateForm($input: DuplicateFormInput!) {
    duplicateForm(input: $input)
  }
`

export const MOVE_FORM_GQL = /* GraphQL */ `
  mutation moveForm($input: MoveFormInput!) {
    moveForm(input: $input)
  }
`

export const MOVE_FORM_TO_TRASH_GQL = /* GraphQL */ `
  mutation moveFormToTrash($input: FormDetailInput!) {
    moveFormToTrash(input: $input)
  }
`

export const RESTORE_FORM_GQL = /* GraphQL */ `
  mutation restoreForm($input: FormDetailInput!) {
    restoreForm(input: $input)
  }
`

export const DELETE_FORM_GQL = /* GraphQL */ `
  mutation deleteForm($input: FormDetailInput!) {
    deleteForm(input: $input)
  }
`

export const FORM_ANALYTIC_GQL = /* GraphQL */ `
  query formAnalytic($input: FormAnalyticInput!) {
    formAnalytic(input: $input) {
      totalVisits {
        value
      }
      submissionCount {
        value
      }
    }
  }
`

export const FORM_INTEGRATIONS_GQL = /* GraphQL */ `
  query formIntegrations($input: FormDetailInput!) {
    formIntegrations(input: $input) {
      formId
      appId
      status
    }
  }
`

export const SEARCH_FORMS_GQL = /* GraphQL */ `
  query searchForms($input: SearchFormInput!) {
    searchForms(input: $input) {
      formId
      formName
    }
  }
`

export const FORM_REPORT_GQL = /* GraphQL */ `
  query formReport($input: FormDetailInput!) {
    formReport(input: $input) {
      responses {
        id
      }
    }
  }
`

export const UPDATE_FORM_LOGICS_GQL = /* GraphQL */ `
  mutation updateFormLogics($input: UpdateFormLogicsInput!) {
    updateFormLogics(input: $input)
  }
`

export const UPDATE_FORM_VARIABLES_GQL = /* GraphQL */ `
  mutation updateFormVariables($input: UpdateFormVariablesInput!) {
    updateFormVariables(input: $input)
  }
`

export const UPDATE_FORM_HIDDEN_FIELDS_GQL = /* GraphQL */ `
  mutation updateFormHiddenFields($input: UpdateHiddenFieldsInput!) {
    updateFormHiddenFields(input: $input)
  }
`

export const UPDATE_FORM_ARCHIVE_GQL = /* GraphQL */ `
  mutation updateFormArchive($input: UpdateFormArchiveInput!) {
    updateFormArchive(input: $input)
  }
`

export const UPDATE_FORM_THEME_GQL = /* GraphQL */ `
  mutation updateFormTheme($input: UpdateFormThemeInput!) {
    updateFormTheme(input: $input)
  }
`

export const TEMPLATE_DETAIL_GQL = /* GraphQL */ `
  query templateDetail($input: TemplateDetailInput!) {
    templateDetail(input: $input) {
      id
    }
  }
`

export const UPDATE_SUBMISSION_ANSWER_GQL = /* GraphQL */ `
  mutation updateSubmissionAnswer($input: UpdateSubmissionAnswerInput!) {
    updateSubmissionAnswer(input: $input)
  }
`

export const PUBLIC_FORM_GQL = /* GraphQL */ `
  query publicForm($input: FormDetailInput!) {
    publicForm(input: $input) {
      id
      name
      settings {
        active
        removeBranding
      }
      fields {
        id
        kind
        title
      }
    }
  }
`

export const OPEN_FORM_GQL = /* GraphQL */ `
  query openForm($input: OpenFormInput!) {
    openForm(input: $input)
  }
`

export const COMPLETE_SUBMISSION_GQL = /* GraphQL */ `
  mutation completeSubmission($input: CompleteSubmissionInput!) {
    completeSubmission(input: $input) {
      clientSecret
    }
  }
`

// ── Submission ──────────────────────────────────────────────────────────────
export const SUBMISSIONS_GQL = /* GraphQL */ `
  query submissions($input: SubmissionsInput!) {
    submissions(input: $input) {
      total
      submissions {
        id
        category
        endAt
      }
    }
  }
`

export const UPDATE_SUBMISSIONS_CATEGORY_GQL = /* GraphQL */ `
  mutation updateSubmissionsCategory($input: UpdateSubmissionsCategoryInput!) {
    updateSubmissionsCategory(input: $input)
  }
`

export const DELETE_SUBMISSIONS_GQL = /* GraphQL */ `
  mutation deleteSubmissions($input: DeleteSubmissionInput!) {
    deleteSubmissions(input: $input)
  }
`

// ── Catalog ─────────────────────────────────────────────────────────────────
export const APPS_GQL = /* GraphQL */ `
  query apps {
    apps {
      id
      name
    }
  }
`

export const TEMPLATES_GQL = /* GraphQL */ `
  query templates {
    templates {
      id
      name
    }
  }
`
