import { gql } from '@apollo/client'

export const LOGIN_GQL = gql`
  query login($input: LoginInput!) {
    login(input: $input)
  }
`

export const SIGN_UP_GQL = gql`
  query signUp($input: SignUpInput!) {
    signUp(input: $input)
  }
`

export const SEND_RESET_EMAIL_GQL = gql`
  mutation sendResetPasswordEmail($input: SendResetPasswordEmailInput!) {
    sendResetPasswordEmail(input: $input)
  }
`

export const RESET_PASSWORD_GQL = gql`
  mutation resetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`

export const CREATE_WORKSPACE_GQL = gql`
  mutation createTeam($input: CreateTeamInput!) {
    createTeam(input: $input)
  }
`

export const PUBLIC_WORKSPACE_DETAIL_GQL = gql`
  query publicTeamDetail($input: PublicTeamDetailInput!) {
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
  }
`

export const UPDATE_WORKSPACE_GQL = gql`
  mutation updateTeam($input: UpdateTeamInput!) {
    updateTeam(input: $input)
  }
`

export const DISSOLVE_WORKSPACE_CODE_GQL = gql`
  query dissolveTeamCode($input: TeamDetailInput!) {
    dissolveTeamCode(input: $input)
  }
`

export const DISSOLVE_WORKSPACE_GQL = gql`
  mutation dissolveTeam($input: DissolveTeamInput!) {
    dissolveTeam(input: $input)
  }
`

export const WORKSPACES_GQL = gql`
  query teams {
    teams {
      id
      name
      ownerId
      avatar
      storageQuota
      memberCount
      isOwner
      inviteCode
      inviteCodeExpireAt
      createdAt
      projects {
        id
        teamId
        name
        ownerId
        icon
        members
        formCount
        isOwner
      }
    }
  }
`

export const WORKSPACE_MEMBERS_GQL = gql`
  query teamMembers($input: TeamDetailInput!) {
    teamMembers(input: $input) {
      id
      name
      email
      avatar
      role
      isOwner
      lastSeenAt
    }
  }
`

export const TRANSFER_WORKSPACE_GQL = gql`
  mutation transferTeam($input: TransferTeamInput!) {
    transferTeam(input: $input)
  }
`

export const LEAVE_WORKSPACE_GQL = gql`
  mutation leaveTeam($input: TeamDetailInput!) {
    leaveTeam(input: $input)
  }
`

export const REMOVE_WORKSPACE_MEMBER_GQL = gql`
  mutation removeTeamMember($input: TransferTeamInput!) {
    removeTeamMember(input: $input)
  }
`

export const JOIN_WORKSPACE_GQL = gql`
  mutation joinTeam($input: JoinTeamInput!) {
    joinTeam(input: $input)
  }
`

export const RESET_WORKSPACE_INVITE_CODE_GQL = gql`
  mutation resetTeamInviteCode($input: TeamDetailInput!) {
    resetTeamInviteCode(input: $input)
  }
`

export const INVITE_MEMBERS_GQL = gql`
  mutation inviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input)
  }
`

export const STRIPE_AUTHORIZE_URL_GQL = gql`
  query stripeAuthorizeUrl($input: FormDetailInput!) {
    stripeAuthorizeUrl(input: $input)
  }
`

export const CONNECT_STRIPE_GQL = gql`
  mutation connectStripe($input: ConnectStripeInput!) {
    connectStripe(input: $input) {
      accountId
      email
    }
  }
`

export const REVOKE_STRIPE_ACCOUNT_GQL = gql`
  mutation revokeStripeAccount($input: FormDetailInput!) {
    revokeStripeAccount(input: $input)
  }
`

export const TEMPLATES_GQL = gql`
  query templates($input: TemplatesInput!) {
    templates(input: $input) {
      id
      category
      name
      thumbnail
      description
      interactiveMode
      kind
      themeSettings {
        theme
      }
      published
    }
  }
`

export const TEMPLATE_DETAIL_GQL = gql`
  query templateDetail($input: TemplateDetailInput!) {
    templateDetail(input: $input) {
      id
      category
      name
      description
      interactiveMode
      kind
      published
      fields {
        id
        title
        description
        kind
        validations
        properties
      }
      hiddenFields {
        id
        name
      }
      themeSettings {
        theme
      }
    }
  }
`

export const USE_TEMPLATE_GQL = gql`
  mutation useTemplate($input: UseTemplateInput!) {
    useTemplate(input: $input)
  }
`

export const CREATE_PROJECT_GQL = gql`
  mutation createProject($input: CreateProjectInput!) {
    createProject(input: $input)
  }
`

export const RENAME_PROJECT_GQL = gql`
  mutation renameProject($input: RenameProjectInput!) {
    renameProject(input: $input)
  }
`

export const EMPTY_TRASH_GQL = gql`
  mutation emptyTrash($input: ProjectDetailInput!) {
    emptyTrash(input: $input)
  }
`

export const DELETE_PROJECT_CODE_GQL = gql`
  query deleteProjectCode($input: ProjectDetailInput!) {
    deleteProjectCode(input: $input)
  }
`

export const DELETE_PROJECT_GQL = gql`
  mutation deleteProject($input: DeleteProjectInput!) {
    deleteProject(input: $input)
  }
`

export const ADD_PROJECT_MEMBER_GQL = gql`
  mutation addProjectMember($input: ProjectMemberInput!) {
    addProjectMember(input: $input)
  }
`

export const DELETE_PROJECT_MEMBER_GQL = gql`
  mutation deleteProjectMember($input: ProjectMemberInput!) {
    deleteProjectMember(input: $input)
  }
`

export const LEAVE_PROJECT_GQL = gql`
  mutation leaveProject($input: ProjectDetailInput!) {
    leaveProject(input: $input)
  }
`

export const FORMS_GQL = gql`
  query forms($input: FormsInput!) {
    forms(input: $input) {
      id
      teamId
      projectId
      memberId
      name
      interactiveMode
      kind
      submissionCount
      fieldUpdateAt
      settings {
        captchaKind
        active
        enableExpirationDate
        expirationTimeZone
        enabledAt
        closedAt
        enableTimeLimit
        timeLimit
        filterSpam
        published
        allowArchive
        password
        requirePassword
        redirectOnCompletion
        redirectUrl
        enableQuotaLimit
        quotaLimit
        enableIpLimit
        ipLimitCount
        ipLimitTime
        enableProgress
        enableQuestionList
        locale
        languages
        enableClosedMessage
        closedFormTitle
        closedFormDescription
      }
      draft
      retentionAt
      suspended
      status
    }
  }
`

export const FORM_ANALYTIC_GQL = gql`
  query formAnalytic($input: FormAnalyticInput!) {
    formAnalytic(input: $input) {
      totalVisits
      submissionCount
      averageTime
    }
  }
`

export const FORM_REPORT_GQL = gql`
  query formReport($input: FormDetailInput!) {
    formReport(input: $input) {
      responses {
        id
        total
        count
        average
        chooses
      }
      submissions {
        _id
        answers {
          submissionId
          kind
          value
          endAt
        }
      }
    }
  }
`

export const FORM_SUMMARY_GQL = gql`
  query formDetail($input: FormDetailInput!) {
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
        enableQuotaLimit
        quotaLimit
        enableIpLimit
        ipLimitCount
        ipLimitTime
        locale
        languages
        enableClosedMessage
        closedFormTitle
        closedFormDescription
      }
      retentionAt
      suspended
      status
    }
  }
`

export const FORM_DETAIL_GQL = gql`
  query formDetail($input: FormDetailInput!) {
    formDetail(input: $input) {
      id
      teamId
      memberId
      name
      description
      interactiveMode
      kind
      stripeAccount {
        accountId
        email
      }
      settings {
        captchaKind
        active
        enableExpirationDate
        expirationTimeZone
        enabledAt
        closedAt
        enableTimeLimit
        timeLimit
        filterSpam
        published
        allowArchive
        password
        requirePassword
        enableQuotaLimit
        quotaLimit
        enableIpLimit
        ipLimitCount
        ipLimitTime
        enableProgress
        enableQuestionList
        locale
        languages
        enableClosedMessage
        closedFormTitle
        closedFormDescription
      }
      fields {
        id
        title
        titleSchema
        description
        kind
        validations
        properties
        layout
      }
      hiddenFields {
        id
        name
      }
      logics
      variables
      fieldUpdateAt
      themeSettings {
        theme
      }
      retentionAt
      suspended
      draft
      status
    }
  }
`

export const CREATE_FORM_GQL = gql`
  mutation createForm($input: CreateFormInput!) {
    createForm(input: $input)
  }
`

export const IMPORT_FORM_GQL = gql`
  query importExternalForm($input: ImportExternalFormInput!) {
    importExternalForm(input: $input)
  }
`

export const CREATE_FORM_HIDDEN_FIELD_GQL = gql`
  mutation createFormHiddenField($input: CreateHiddenFieldInput!) {
    createFormHiddenField(input: $input)
  }
`

export const UPDATE_FORM_HIDDEN_FIELD_GQL = gql`
  mutation updateFormHiddenField($input: CreateHiddenFieldInput!) {
    updateFormHiddenField(input: $input)
  }
`

export const DELETE_FORM_HIDDEN_FIELD_GQL = gql`
  mutation deleteFormHiddenField($input: DeleteHiddenFieldInput!) {
    deleteFormHiddenField(input: $input)
  }
`

export const UPDATE_FORM_SCHEMAS_GQL = gql`
  mutation updateFormSchemas($input: UpdateFormSchemasInput!) {
    updateFormSchemas(input: $input)
  }
`

export const UPDATE_FORM_LOGICS = gql`
  mutation ($input: UpdateFormLogicsInput!) {
    updateFormLogics(input: $input)
  }
`

export const UPDATE_FORM_VARIABLES = gql`
  mutation ($input: UpdateFormVariablesInput!) {
    updateFormVariables(input: $input)
  }
`

export const CREATE_FORM_FIELD_GQL = gql`
  mutation createFormField($input: CreateFormFieldInput!) {
    createFormField(input: $input)
  }
`

export const UPDATE_FORM_FIELD_GQL = gql`
  mutation updateFormField($input: UpdateFormFieldInput!) {
    updateFormField(input: $input)
  }
`

export const DELETE_FORM_FIELD_GQL = gql`
  mutation deleteFormField($input: DeleteFormFieldInput!) {
    deleteFormField(input: $input)
  }
`

export const UPDATE_FORM_GQL = gql`
  mutation ($input: UpdateFormInput!) {
    updateForm(input: $input)
  }
`

export const UPDATE_FORM_ARCHIVE_GQL = gql`
  mutation ($input: UpdateFormArchiveInput!) {
    updateFormArchive(input: $input)
  }
`

export const UPDATE_FORM_THEME_GQL = gql`
  mutation updateFormTheme($input: UpdateFormThemeInput!) {
    updateFormTheme(input: $input)
  }
`

export const FORM_INTEGRATIONS_GQL = gql`
  query formIntegrations($input: FormDetailInput!) {
    formIntegrations(input: $input) {
      formId
      appId
      attributes
      status
    }
  }
`

export const UPDATE_FORM_INTEGRATIONS_GQL = gql`
  mutation ($input: UpdateFormIntegrationInput!) {
    updateFormIntegration(input: $input)
  }
`

export const DUPLICATE_FORM_GQL = gql`
  mutation duplicateForm($input: FormDetailInput!) {
    duplicateForm(input: $input)
  }
`

export const SEARCH_FORM_GQL = gql`
  query searchForms($input: SearchFormInput!) {
    searchForms(input: $input) {
      teamId
      teamName
      formId
      formName
      templateId
      templateName
    }
  }
`

export const MOVE_FORM_TO_TRASH_GQL = gql`
  mutation moveFormToTrash($input: FormDetailInput!) {
    moveFormToTrash(input: $input)
  }
`

export const RESTORE_FORM_GQL = gql`
  mutation restoreForm($input: FormDetailInput!) {
    restoreForm(input: $input)
  }
`

export const DELETE_FORM_GQL = gql`
  mutation deleteForm($input: FormDetailInput!) {
    deleteForm(input: $input)
  }
`

export const APPS_GQL = gql`
  query apps {
    apps {
      id
      uniqueId
      category
      name
      description
      avatar
      homepage
      helpLinkUrl
      status
    }
  }
`

export const APP_DETAIL_GQL = gql`
  query appDetail($input: AppDetailInput!) {
    appDetail(input: $input) {
      id
      name
      description
      avatar
      homepage
      status
    }
  }
`

export const APP_AUTHORIZE_URL_GQL = gql`
  query appAuthorizeUrl($input: AppAuthorizeUrlInput!) {
    appAuthorizeUrl(input: $input)
  }
`

export const SUBMISSIONS_GQL = gql`
  query submissions($input: SubmissionsInput!) {
    submissions(input: $input) {
      total
      submissions {
        id
        category
        title
        answers
        hiddenFields {
          id
          name
          value
        }
        endAt
      }
    }
  }
`

export const UPDATE_SUBMISSIONS_CATEGORY_GQL = gql`
  mutation updateSubmissionsCategory($input: UpdateSubmissionsCategoryInput!) {
    updateSubmissionsCategory(input: $input)
  }
`

export const DELETE_SUBMISSIONS_GQL = gql`
  mutation deleteSubmissions($input: DeleteSubmissionInput!) {
    deleteSubmissions(input: $input)
  }
`

export const UPDATE_SUBMISSION_ANSWER_GQL = gql`
  mutation updateSubmissionAnswer($input: UpdateSubmissionAnswerInput!) {
    updateSubmissionAnswer(input: $input)
  }
`

export const SUBMISSION_LOCATIONS_GQL = gql`
  query submissionLocations($input: SubmissionLocationsInput!) {
    submissionLocations(input: $input) {
      code
      total
    }
  }
`

export const SUBMISSION_ANSWERS_GQL = gql`
  query submissionAnswers($input: SubmissionAnswersInput!) {
    submissionAnswers(input: $input) {
      total
      answers {
        kind
        value
        endAt
      }
    }
  }
`

export const USER_DETAILS_GQL = gql`
  query userDetail {
    userDetail {
      id
      name
      email
      avatar
      lang
      isEmailVerified
      isSocialAccount
      isDeletionScheduled
      deletionScheduledAt
    }
  }
`

export const UPDATE_USER_DETAIL_GQL = gql`
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input)
  }
`

export const CHANGE_EMAIL_CODE_GQL = gql`
  query changeEmailCode($input: ChangeEmailCodeInput!) {
    changeEmailCode(input: $input)
  }
`

export const UPDATE_EMAIL_GQL = gql`
  mutation updateEmail($input: UpdateEmailInput!) {
    updateEmail(input: $input)
  }
`

export const VERIFY_EMAIL_GQL = gql`
  mutation verifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input)
  }
`

export const UPDATE_USER_PASSWORD_GQL = gql`
  mutation updateUserPassword($input: UpdateUserPasswordInput!) {
    updateUserPassword(input: $input)
  }
`

export const EMAIL_VERIFICATION_CODE_GQL = gql`
  query emailVerificationCode {
    emailVerificationCode
  }
`

export const USER_DELETION_CODE_GQL = gql`
  query userDeletionCode {
    userDeletionCode
  }
`

export const VERIFY_USER_DELETION_GQL = gql`
  mutation verifyUserDeletion($input: VerifyUserDeletionInput!) {
    verifyUserDeletion(input: $input)
  }
`

export const CANCEL_USER_DELETION_GQL = gql`
  mutation cancelUserDeletion {
    cancelUserDeletion
  }
`

export const THIRD_PARTY_OAUTH_URL_GQL = gql`
  query thirdPartyOauthUrl($input: ThirdPartyInput!) {
    thirdPartyOauthUrl(input: $input)
  }
`

export const UPDATE_INTEGRATION_SETTINGS_GQL = gql`
  mutation updateIntegrationSettings($input: UpdateIntegrationInput!) {
    updateIntegrationSettings(input: $input)
  }
`

export const UPDATE_INTEGRATION_STATUS_GQL = gql`
  mutation updateIntegrationStatus($input: UpdateIntegrationStatusInput!) {
    updateIntegrationStatus(input: $input)
  }
`

export const DELETE_INTEGRATION_SETTINGS_GQL = gql`
  mutation deleteIntegrationSettings($input: ThirdPartyInput!) {
    deleteIntegrationSettings(input: $input)
  }
`

export const UNSPLASH_SEARCH_GQL = gql`
  query unsplashSearch($input: UnsplashSearchInput!) {
    unsplashSearch(input: $input) {
      id
      url
      thumbUrl
      downloadUrl
      author
      authorUrl
    }
  }
`

export const UNSPLASH_TRACK_DOWNLOAD_GQL = gql`
  mutation unsplashTrackDownload($input: UnsplashTrackDownloadInput!) {
    unsplashTrackDownload(input: $input)
  }
`

export const PUBLIC_FORM_GQL = gql`
  query publicForm($input: FormDetailInput!) {
    publicForm(input: $input) {
      id
      teamId
      memberId
      name
      description
      interactiveMode
      kind
      stripeAccount {
        accountId
        email
      }
      settings {
        captchaKind
        active
        enableExpirationDate
        expirationTimeZone
        enabledAt
        closedAt
        enableTimeLimit
        timeLimit
        filterSpam
        published
        allowArchive
        password
        requirePassword
        enableQuotaLimit
        quotaLimit
        enableIpLimit
        ipLimitCount
        ipLimitTime
        enableProgress
        enableQuestionList
        locale
        languages
        enableClosedMessage
        closedFormTitle
        closedFormDescription
      }
      fields {
        id
        title
        titleSchema
        description
        kind
        validations
        properties
        layout
      }
      translations
      hiddenFields {
        id
        name
      }
      logics
      variables
      fieldUpdateAt
      themeSettings {
        theme
      }
      retentionAt
      suspended
      draft
      status
      integrations
    }
  }
`

export const INIT_GEETEST_CAPTCHA_GQL = gql`
  query initGeetestCaptcha($input: FormDetailInput!) {
    initGeetestCaptcha(input: $input) {
      challenge
      gt
      new_captcha
      success
    }
  }
`

export const OPEN_FORM_GQL = gql`
  query openForm($input: OpenFormInput!) {
    openForm(input: $input)
  }
`

export const VERIFY_FORM_PASSWORD_GQL = gql`
  query verifyFormPassword($input: VerifyPasswordInput!) {
    verifyFormPassword(input: $input)
  }
`

export const COMPLETE_SUBMISSION_GQL = gql`
  mutation completeSubmission($input: CompleteSubmissionInput!) {
    completeSubmission(input: $input) {
      clientSecret
    }
  }
`
