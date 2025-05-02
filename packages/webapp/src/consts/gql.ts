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
      additionalSeats
      isOwner
      inviteCode
      inviteCodeExpireAt
      removeBranding
      trialEndAt
      createdAt
      aiKey
      aiEndpoint
      aiModel
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
      brandKits {
        id
        logo
        theme
      }
      plan {
        id
        name
        memberLimit
        formLimit
        contactLimit
        questionLimit
        submissionLimit
        storageLimit
        apiAccessLimit
        multiLanguage
        customDomain
        whitelabelBranding
        grade
      }
      subscription {
        id
        planId
        billingCycle
        startAt
        endAt
        isCanceled
        canceledAt
        trialing
        status
      }
    }
  }
`

export const WORKSPACE_SUBSCRIPTION_GQL = gql`
  query teamSubscription($input: TeamDetailInput!) {
    teamSubscription(input: $input) {
      memberCount
      contactCount
      formCount
      storageQuota
      submissionQuota
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

export const WORKSPACE_RECENT_FORMS_GQL = gql`
  query teamRecentForms($input: RecentFormsInput!) {
    teamRecentForms(input: $input) {
      id
      teamId
      projectId
      memberId
      name
      interactiveMode
      kind
      submissionCount
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
      retentionAt
      suspended
      status
      updatedAt
      version
      isDraft
      canPublish
      fieldsUpdatedAt
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

export const UPDATE_WORKSPACE_MEMBER_GQL = gql`
  mutation updateTeamMemberRole($input: UpdateTeamMemberInput!) {
    updateTeamMemberRole(input: $input)
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

export const ADD_CUSTOM_DOMAIN_GQL = gql`
  mutation addCustomDomain($input: AddCustomDomainInput!) {
    addCustomDomain(input: $input)
  }
`

export const EXPORT_WORKSPACE_DATA_GQL = gql`
  mutation exportTeamData($input: TeamDetailInput!) {
    exportTeamData(input: $input)
  }
`

export const INVITE_MEMBERS_GQL = gql`
  mutation inviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input)
  }
`

export const CREATE_BRAND_KIT_GQL = gql`
  mutation createBrandKit($input: CreateBrandKitInput!) {
    createBrandKit(input: $input)
  }
`

export const UPDATE_BRAND_KIT_GQL = gql`
  mutation updateBrandKit($input: UpdateBrandKitInput!) {
    updateBrandKit(input: $input)
  }
`

export const SEARCH_WORKSPACE_GQL = gql`
  query searchTeam($input: SearchTeamInput!) {
    searchTeam(input: $input) {
      forms {
        id
        teamId
        projectId
        name
        interactiveMode
        kind
        memberId
        suspended
        status
        updatedAt
        isDraft
        version
      }
      docs {
        id
        title
        description
      }
    }
  }
`

export const PLANS_GQL = gql`
  query plans {
    plans {
      id
      name
      memberLimit
      storageLimit
      apiAccessLimit
      autoResponse
      customDomain
      customThankYouPage
      whitelabelBranding
      multiLanguage
      fileExport
      grade
      prices {
        type
        price
        billingCycle
      }
    }
  }
`

export const WORKSPACE_CDN_TOKEN_GQL = gql`
  query teamCdnToken($input: TeamCdnTokenInput!) {
    teamCdnToken(input: $input) {
      token
      urlPrefix
      key
    }
  }
`

export const INVOICES_GQL = gql`
  query invoices($input: TeamDetailInput!) {
    invoices(input: $input) {
      id
      note
      pdfUrl
      total
      paidAt
      status
    }
  }
`

export const ORDERS_GQL = gql`
  query orders($input: TeamDetailInput!) {
    orders(input: $input) {
      id
      planId
      planName
      billingCycle
      kind
      seatCount
      seatsAmount
      amount
      discount
      total
      paymentMethod
      paidAt
      note
      status
    }
  }
`

export const APPLY_COUPON_GQL = gql`
  query applyCoupon($input: ApplyCouponInput!) {
    applyCoupon(input: $input) {
      id
      amountOff
      percentOff
    }
  }
`

export const PAYMENT_GQL = gql`
  mutation payment($input: PaymentInput!) {
    payment(input: $input) {
      sessionUrl
      note
    }
  }
`

export const CANCEL_SUBSCRIPTION_GQL = gql`
  mutation cancelSubscription($input: TeamDetailInput!) {
    cancelSubscription(input: $input)
  }
`

export const ADD_ADDITIONAL_SEAT_GQL = gql`
  mutation additionalSeat($input: AdditionalSeatInput!) {
    additionalSeat(input: $input) {
      note
    }
  }
`

export const FREE_TRIAL_GQL = gql`
  mutation freeTrial($input: FreeTrialInput!) {
    freeTrial(input: $input)
  }
`

export const ORDER_PREVIEW_GQL = gql`
  query orderPreview($input: OrderPreviewInput!) {
    orderPreview(input: $input) {
      planId
      planName
      billingCycle
      kind
      seatCount
      seatsAmount
      amount
      discount
      total
    }
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

export const CUSTOMER_PORTAL_GQL = gql`
  mutation stripeCustomerPortal($input: TeamDetailInput!) {
    stripeCustomerPortal(input: $input)
  }
`

export const TEMPLATES_GQL = gql`
  query templates {
    templates {
      id
      recordId
      category
      name
      thumbnail
    }
  }
`

export const TEMPLATE_DETAILS_GQL = gql`
  query templateDetail($input: TemplateDetailInput!) {
    templateDetail(input: $input) {
      id
      fields {
        id
        title
        description
        kind
        validations
        properties
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

export const CREATE_FORM_CUSTOM_REPORT_GQL = gql`
  mutation createFormCustomReport($input: FormDetailInput!) {
    createFormCustomReport(input: $input)
  }
`

export const UPDATE_FORM_CUSTOM_REPORT_GQL = gql`
  mutation updateFormCustomReport($input: UpdateFormCustomReportInput!) {
    updateFormCustomReport(input: $input)
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

export const UPLOAD_FORM_IMAGE_GQL = gql`
  mutation uploadFormImage($input: UploadFormImageInput!) {
    uploadFormImage(input: $input)
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
      version
      isDraft
      canPublish
      fieldsUpdatedAt
      retentionAt
      suspended
      status
      updatedAt
    }
  }
`

export const FORM_ANALYTIC_GQL = gql`
  query formAnalytic($input: FormAnalyticInput!) {
    formAnalytic(input: $input) {
      totalVisits {
        value
        change
      }
      submissionCount {
        value
        change
      }
      completeRate {
        value
        change
      }
      averageTime {
        value
        change
      }
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
      submissionCount
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
        enableNavigationArrows
        enableEmailNotification
        locale
        languages
        enableClosedMessage
        closedFormTitle
        closedFormDescription
        redirectOnCompletion
        redirectUrl
        metaTitle
        metaDescription
        metaOGImageUrl
      }
      drafts {
        id
        title
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
      translations
      logics
      variables
      themeSettings {
        logo
        theme
      }
      retentionAt
      suspended
      version
      isDraft
      canPublish
      fieldsUpdatedAt
      submissionCount
      customReport {
        id
        hiddenFields
        theme
        enablePublicAccess
      }
      status
      updatedAt
    }
  }
`

export const OPEN_FORM_GQL = gql`
  query openForm($input: OpenFormInput!) {
    openForm(input: $input)
  }
`

export const COMPLETE_SUBMISSION_GQL = gql`
  mutation completeSubmission($input: CompleteSubmissionInput!) {
    completeSubmission(input: $input) {
      clientSecret
    }
  }
`

export const CREATE_FORM_GQL = gql`
  mutation createForm($input: CreateFormInput!) {
    createForm(input: $input)
  }
`

export const CREATE_FORM_WITH_AI_GQL = gql`
  mutation createFormWithAI($input: CreateFormWithAIInput!) {
    createFormWithAI(input: $input)
  }
`

export const CREATE_FIELDS_WITH_AI_GQL = gql`
  mutation createFieldsWithAI($input: CreateFieldsWithAIInput!) {
    createFieldsWithAI(input: $input)
  }
`

export const IMPORT_FORM_GQL = gql`
  query importExternalForm($input: ImportExternalFormInput!) {
    importExternalForm(input: $input)
  }
`

export const UPDATE_FORM_SCHEMAS_GQL = gql`
  mutation updateFormSchemas($input: UpdateFormSchemasInput!) {
    updateFormSchemas(input: $input) {
      version
      drafts {
        id
        title
        description
        kind
        validations
        properties
        layout
        width
        hide
        frozen
      }
      canPublish
    }
  }
`

export const PUBLISH_FORM_SQL = gql`
  mutation publishForm($input: UpdateFormSchemasInput!) {
    publishForm(input: $input)
  }
`

export const UPDATE_FORM_LOGICS_GQL = gql`
  mutation ($input: UpdateFormLogicsInput!) {
    updateFormLogics(input: $input)
  }
`

export const CREATE_FORM_LOGICS_WITH_AI_GQL = gql`
  mutation createFormLogicsWithAI($input: CreateFieldsWithAIInput!) {
    createFormLogicsWithAI(input: $input)
  }
`

export const CREATE_FORM_THEME_WITH_AI_GQL = gql`
  mutation createFormThemeWithAI($input: CreateFormThemeWithAIInput!) {
    createFormThemeWithAI(input: $input)
  }
`

export const UPDATE_FORM_VARIABLES_GQL = gql`
  mutation ($input: UpdateFormVariablesInput!) {
    updateFormVariables(input: $input)
  }
`

export const UPDATE_FORM_HIDDEN_FIELDS_GQL = gql`
  mutation updateFormHiddenFields($input: UpdateHiddenFieldsInput!) {
    updateFormHiddenFields(input: $input)
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
  mutation duplicateForm($input: DuplicateFormInput!) {
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

export const MOVE_FORM_TO_PROJECT_GQL = gql`
  mutation moveForm($input: MoveFormInput!) {
    moveForm(input: $input)
  }
`

export const APPS_GQL = gql`
  query apps {
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
        variables
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

export const USER_CDN_TOKEN_GQL = gql`
  query userCdnToken($input: CdnTokenInput!) {
    userCdnToken(input: $input) {
      urlPrefix
      token
      key
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
      isOnboardRequired
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

export const MAILCHIMP_OAUTH_GQL = gql`
  mutation mailchimpOauth($input: ThirdPartyOAuthInput!) {
    mailchimpOauth(input: $input)
  }
`

export const MAILCHIMP_AUDIENCES_GQL = gql`
  query mailchimpAudiences($input: ThirdPartyInput!) {
    mailchimpAudiences(input: $input) {
      id
      name
    }
  }
`

export const AIRTABLE_OAUTH_GQL = gql`
  mutation airtableOauth($input: ThirdPartyOAuthInput!) {
    airtableOauth(input: $input)
  }
`

export const AIRTABLE_BASES_GQL = gql`
  query airtableBases($input: ThirdPartyInput!) {
    airtableBases(input: $input) {
      id
      name
    }
  }
`

export const AIRTABLE_TABLES_GQL = gql`
  query airtableTables($input: AirtableTablesInput!) {
    airtableTables(input: $input) {
      id
      name
      fields {
        id
        name
        type
      }
    }
  }
`

export const GOOGLE_OAUTH_GQL = gql`
  mutation googleOauth($input: ThirdPartyOAuthInput!) {
    googleOauth(input: $input)
  }
`

export const GOOGLE_DRIVE_LIST_GQL = gql`
  query googleDriveList($input: ThirdPartyInput!) {
    googleDriveList(input: $input) {
      id
      name
    }
  }
`

export const GOOGLE_DRIVE_FOLDERS_GQL = gql`
  query googleDriveFolders($input: GoogleDriveFoldersInput!) {
    googleDriveFolders(input: $input) {
      id
      name
    }
  }
`

export const GOOGLE_SHEETS_LIST_GQL = gql`
  query googleSheetsList($input: GoogleDriveFoldersInput!) {
    googleSheetsList(input: $input) {
      id
      name
    }
  }
`

export const GOOGLE_SHEETS_WORKSHEETS_GQL = gql`
  query googleSheetsWorksheets($input: GoogleSheetsWorksheetsInput!) {
    googleSheetsWorksheets(input: $input)
  }
`

export const GOOGLE_SHEETS_FIELDS_GQL = gql`
  query googleSheetsFields($input: GoogleSheetsFieldsInput!) {
    googleSheetsFields(input: $input)
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

export const HUBSPOT_OAUTH_GQL = gql`
  mutation hubspotOauth($input: ThirdPartyOAuthInput!) {
    hubspotOauth(input: $input)
  }
`

export const MONDAY_OAUTH_GQL = gql`
  mutation mondayOauth($input: ThirdPartyOAuthInput!) {
    mondayOauth(input: $input)
  }
`

export const MONDAY_BOARDS_GQL = gql`
  query mondayBoards($input: ThirdPartyInput!) {
    mondayBoards(input: $input) {
      id
      name
      state
    }
  }
`

export const MONDAY_GROUPS_GQL = gql`
  query mondayGroups($input: MondayGroupsInput!) {
    mondayGroups(input: $input) {
      id
      title
    }
  }
`

export const MONDAY_FIELDS_GQL = gql`
  query mondayFields($input: MondayGroupsInput!) {
    mondayFields(input: $input) {
      id
      title
      type
    }
  }
`

export const SUPPORTPAL_DEPARTMENTS_GQL = gql`
  query supportpalDepartments($input: SupportPalInput!) {
    supportpalDepartments(input: $input) {
      id
      name
    }
  }
`

export const SUPPORTPAL_PRIORITIES_GQL = gql`
  query supportpalPriorities($input: SupportPalPrioritiesInput!) {
    supportpalPriorities(input: $input) {
      id
      name
    }
  }
`

export const SUPPORTPAL_STATUS_GQL = gql`
  query supportpalStatus($input: SupportPalInput!) {
    supportpalStatus(input: $input) {
      id
      name
    }
  }
`

export const GITHUB_OAUTH_GQL = gql`
  mutation githubOauth($input: ThirdPartyOAuthInput!) {
    githubOauth(input: $input)
  }
`

export const GITHUB_ORGANIZATIONS_GQL = gql`
  query githubOrganizations($input: ThirdPartyInput!) {
    githubOrganizations(input: $input) {
      login
      organization
    }
  }
`

export const GITHUB_REPOSITORIES_GQL = gql`
  query githubRepositories($input: GithubRepositoriesInput!) {
    githubRepositories(input: $input)
  }
`

export const GITHUB_ASSIGNEES_GQL = gql`
  query githubAssignees($input: GithubAssigneesInput!) {
    githubAssignees(input: $input)
  }
`

export const GITHUB_LABELS_GQL = gql`
  query githubLabels($input: GithubAssigneesInput!) {
    githubLabels(input: $input)
  }
`

export const GITHUB_MILESTONES_GQL = gql`
  query githubMilestones($input: GithubAssigneesInput!) {
    githubMilestones(input: $input) {
      title
      number
    }
  }
`

export const GITLAB_GROUPS_GQL = gql`
  query gitlabGroups($input: GitlabInput!) {
    gitlabGroups(input: $input) {
      id
      name
    }
  }
`

export const GITLAB_PROJECTS_GQL = gql`
  query gitlabProjects($input: GitlabProjectsInput!) {
    gitlabProjects(input: $input) {
      id
      name
    }
  }
`

export const GITLAB_MEMBERS_GQL = gql`
  query gitlabMembers($input: GitlabMembersInput!) {
    gitlabMembers(input: $input) {
      id
      name
    }
  }
`

export const GITLAB_LABELS_GQL = gql`
  query gitlabLabels($input: GitlabMembersInput!) {
    gitlabLabels(input: $input) {
      id
      name
    }
  }
`

export const GITLAB_MILESTONES_GQL = gql`
  query gitlabMilestones($input: GitlabMembersInput!) {
    gitlabMilestones(input: $input) {
      id
      name
    }
  }
`

export const DROPBOX_OAUTH_GQL = gql`
  mutation dropboxOauth($input: ThirdPartyOAuthInput!) {
    dropboxOauth(input: $input)
  }
`

export const DROPBOX_FOLDERS_GQL = gql`
  query dropboxFolders($input: ThirdPartyInput!) {
    dropboxFolders(input: $input) {
      id
      name
    }
  }
`

export const CONTACTS_GQL = gql`
  query contacts($input: ContactsInput!) {
    contacts(input: $input) {
      total
      contacts {
        id
        teamId
        fullName
        email
        avatar
        phoneNumber
        jobTitle
        groups {
          id
          name
        }
      }
    }
  }
`

export const SLACK_OAUTH_GQL = gql`
  mutation slackOauth($input: ThirdPartyOAuthInput!) {
    slackOauth(input: $input)
  }
`

export const SLACK_CHANNELS_GQL = gql`
  query slackChannels($input: ThirdPartyInput!) {
    slackChannels(input: $input) {
      id
      name
    }
  }
`

export const NOTION_OAUTH_GQL = gql`
  mutation notionOauth($input: ThirdPartyOAuthInput!) {
    notionOauth(input: $input)
  }
`

export const NOTION_DATABASES_GQL = gql`
  query notionDatabases($input: ThirdPartyInput!) {
    notionDatabases(input: $input) {
      id
      name
      fields {
        id
        name
        type
      }
    }
  }
`

export const CREATE_CONTACT_GQL = gql`
  mutation createContact($input: CreateContactInput!) {
    createContact(input: $input)
  }
`

export const IMPORT_CONTACTS_GQL = gql`
  mutation importContacts($input: ImportContactsInput!) {
    importContacts(input: $input)
  }
`

export const UPDATE_CONTACT_GQL = gql`
  mutation updateContact($input: UpdateContactInput!) {
    updateContact(input: $input)
  }
`

export const DELETE_CONTACTS_GQL = gql`
  mutation deleteContacts($input: DeleteContactsInput!) {
    deleteContacts(input: $input)
  }
`

export const GROUPS_GQL = gql`
  query groups($input: GroupsInput!) {
    groups(input: $input) {
      total
      groups {
        id
        teamId
        name
        contactCount
      }
    }
  }
`

export const CREATE_GROUP_GQL = gql`
  mutation createGroup($input: CreateGroupInput!) {
    createGroup(input: $input)
  }
`

export const UPDATE_GROUP_GQL = gql`
  mutation updateGroup($input: UpdateGroupInput!) {
    updateGroup(input: $input)
  }
`

export const DELETE_GROUP_GQL = gql`
  mutation deleteGroup($input: DeleteGroupInput!) {
    deleteGroup(input: $input)
  }
`

export const SHARE_TO_AUDIENCE_GQL = gql`
  mutation shareToAudience($input: ShareToAudienceInput!) {
    shareToAudience(input: $input)
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

export const EXPORT_FORM_TO_JSON_GQL = gql`
  query exportFormToJSON($input: ExportFormToJSONInput!) {
    exportFormToJSON(input: $input)
  }
`

export const IMPORT_FORM_FROM_JSON_GQL = gql`
  mutation importFormFromJSON($input: ImportFormFromJSONInput!) {
    importFormFromJSON(input: $input)
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
      drafts {
        id
        title
        titleSchema
        description
        kind
        validations
        properties
        layout
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
      fieldsUpdatedAt
      themeSettings {
        theme
      }
      retentionAt
      suspended
      isDraft
      status
      integrations
    }
  }
`

export const VERIFY_FORM_PASSWORD_GQL = gql`
  query verifyFormPassword($input: VerifyPasswordInput!) {
    verifyFormPassword(input: $input)
  }
`
