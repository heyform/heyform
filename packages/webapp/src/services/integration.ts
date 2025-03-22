import {
  AIRTABLE_BASES_GQL,
  AIRTABLE_OAUTH_GQL,
  AIRTABLE_TABLES_GQL,
  DELETE_INTEGRATION_SETTINGS_GQL,
  DROPBOX_FOLDERS_GQL,
  DROPBOX_OAUTH_GQL,
  GITHUB_ASSIGNEES_GQL,
  GITHUB_LABELS_GQL,
  GITHUB_MILESTONES_GQL,
  GITHUB_OAUTH_GQL,
  GITHUB_ORGANIZATIONS_GQL,
  GITHUB_REPOSITORIES_GQL,
  GITLAB_GROUPS_GQL,
  GITLAB_LABELS_GQL,
  GITLAB_MEMBERS_GQL,
  GITLAB_MILESTONES_GQL,
  GITLAB_PROJECTS_GQL,
  GOOGLE_DRIVE_FOLDERS_GQL,
  GOOGLE_DRIVE_LIST_GQL,
  GOOGLE_OAUTH_GQL,
  GOOGLE_SHEETS_FIELDS_GQL,
  GOOGLE_SHEETS_LIST_GQL,
  GOOGLE_SHEETS_WORKSHEETS_GQL,
  HUBSPOT_OAUTH_GQL,
  INTEGRATION_STATUS_ENUM,
  MAILCHIMP_AUDIENCES_GQL,
  MAILCHIMP_OAUTH_GQL,
  MONDAY_BOARDS_GQL,
  MONDAY_FIELDS_GQL,
  MONDAY_GROUPS_GQL,
  MONDAY_OAUTH_GQL,
  NOTION_DATABASES_GQL,
  NOTION_OAUTH_GQL,
  SLACK_CHANNELS_GQL,
  SLACK_OAUTH_GQL,
  SUPPORTPAL_DEPARTMENTS_GQL,
  SUPPORTPAL_PRIORITIES_GQL,
  SUPPORTPAL_STATUS_GQL,
  THIRD_PARTY_OAUTH_URL_GQL,
  UPDATE_INTEGRATION_SETTINGS_GQL,
  UPDATE_INTEGRATION_STATUS_GQL
} from '@/consts'
import { apollo } from '@/utils'

export class IntegrationService {
  static async oauthUrl(formId: string, appId: string) {
    return apollo.query({
      query: THIRD_PARTY_OAUTH_URL_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async mailchimpOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: MAILCHIMP_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async mailchimpAudiences(formId: string, appId: string) {
    return apollo.query({
      query: MAILCHIMP_AUDIENCES_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async updateSettings(formId: string, appId: string, data: AnyMap) {
    return apollo.mutate({
      mutation: UPDATE_INTEGRATION_SETTINGS_GQL,
      variables: {
        input: {
          formId,
          appId,
          ...data
        }
      }
    })
  }

  static async updateStatus(formId: string, appId: string, status: INTEGRATION_STATUS_ENUM) {
    return apollo.mutate({
      mutation: UPDATE_INTEGRATION_STATUS_GQL,
      variables: {
        input: {
          formId,
          appId,
          status
        }
      }
    })
  }

  static async deleteSettings(formId: string, appId: string) {
    return apollo.mutate({
      mutation: DELETE_INTEGRATION_SETTINGS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async airtableOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: AIRTABLE_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async airtableBases(formId: string, appId: string) {
    return apollo.mutate({
      mutation: AIRTABLE_BASES_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async airtableTables(formId: string, appId: string, baseId: string) {
    return apollo.mutate({
      mutation: AIRTABLE_TABLES_GQL,
      variables: {
        input: {
          formId,
          appId,
          baseId
        }
      }
    })
  }

  static async googleOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: GOOGLE_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async googleDriveList(formId: string, appId: string) {
    return apollo.query({
      query: GOOGLE_DRIVE_LIST_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async googleDriveFolders(formId: string, appId: string, drive?: string) {
    return apollo.query({
      query: GOOGLE_DRIVE_FOLDERS_GQL,
      variables: {
        input: {
          formId,
          appId,
          drive
        }
      }
    })
  }

  static async googleSheetsList(formId: string, appId: string, drive?: string) {
    return apollo.query({
      query: GOOGLE_SHEETS_LIST_GQL,
      variables: {
        input: {
          formId,
          appId,
          drive
        }
      }
    })
  }

  static async googleSheetsWorksheets(formId: string, appId: string, spreadsheet: string) {
    return apollo.query({
      query: GOOGLE_SHEETS_WORKSHEETS_GQL,
      variables: {
        input: {
          formId,
          appId,
          spreadsheet
        }
      }
    })
  }

  static async googleSheetsFields(
    formId: string,
    appId: string,
    spreadsheet: string,
    worksheet: string
  ) {
    return apollo.query({
      query: GOOGLE_SHEETS_FIELDS_GQL,
      variables: {
        input: {
          formId,
          appId,
          spreadsheet,
          worksheet
        }
      }
    })
  }

  static async hubspotOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: HUBSPOT_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async mondayOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: MONDAY_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async mondayBoards(formId: string, appId: string) {
    return apollo.mutate({
      mutation: MONDAY_BOARDS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async mondayGroups(formId: string, appId: string, board: number | string) {
    return apollo.mutate({
      mutation: MONDAY_GROUPS_GQL,
      variables: {
        input: {
          formId,
          appId,
          board
        }
      }
    })
  }

  static async mondayFields(formId: string, appId: string, board: number | string) {
    return apollo.mutate({
      mutation: MONDAY_FIELDS_GQL,
      variables: {
        input: {
          formId,
          appId,
          board
        }
      }
    })
  }

  static async supportPalDepartments(formId: string, systemURL: string, token: string) {
    return apollo.mutate({
      mutation: SUPPORTPAL_DEPARTMENTS_GQL,
      variables: {
        input: {
          formId,
          systemURL,
          token
        }
      }
    })
  }

  static async supportPalPriorities(
    formId: string,
    systemURL: string,
    token: string,
    departmentId: number
  ) {
    return apollo.mutate({
      mutation: SUPPORTPAL_PRIORITIES_GQL,
      variables: {
        input: {
          formId,
          systemURL,
          token,
          departmentId
        }
      }
    })
  }

  static async supportPalStatus(formId: string, systemURL: string, token: string) {
    return apollo.mutate({
      mutation: SUPPORTPAL_STATUS_GQL,
      variables: {
        input: {
          formId,
          systemURL,
          token
        }
      }
    })
  }

  static async githubOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: GITHUB_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async githubOrganizations(formId: string, appId: string) {
    return apollo.mutate({
      mutation: GITHUB_ORGANIZATIONS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async githubRepositories(formId: string, appId: string, organization: AnyMap) {
    return apollo.mutate({
      mutation: GITHUB_REPOSITORIES_GQL,
      variables: {
        input: {
          formId,
          appId,
          ...organization
        }
      }
    })
  }

  static async githubAssignees(formId: string, appId: string, repository: string) {
    return apollo.mutate({
      mutation: GITHUB_ASSIGNEES_GQL,
      variables: {
        input: {
          formId,
          appId,
          repository
        }
      }
    })
  }

  static async githubLabels(formId: string, appId: string, repository: string) {
    return apollo.mutate({
      mutation: GITHUB_LABELS_GQL,
      variables: {
        input: {
          formId,
          appId,
          repository
        }
      }
    })
  }

  static async githubMilestones(formId: string, appId: string, repository: string) {
    return apollo.mutate({
      mutation: GITHUB_MILESTONES_GQL,
      variables: {
        input: {
          formId,
          appId,
          repository
        }
      }
    })
  }

  static async gitlabGroups(formId: string, server: string, token: string) {
    return apollo.mutate({
      mutation: GITLAB_GROUPS_GQL,
      variables: {
        input: {
          formId,
          server,
          token
        }
      }
    })
  }

  static async gitlabProjects(formId: string, server: string, token: string, group: string) {
    return apollo.mutate({
      mutation: GITLAB_PROJECTS_GQL,
      variables: {
        input: {
          formId,
          server,
          token,
          group
        }
      }
    })
  }

  static async gitlabMembers(formId: string, server: string, token: string, project: string) {
    return apollo.mutate({
      mutation: GITLAB_MEMBERS_GQL,
      variables: {
        input: {
          formId,
          server,
          token,
          project
        }
      }
    })
  }

  static async gitlabLabels(formId: string, server: string, token: string, project: string) {
    return apollo.mutate({
      mutation: GITLAB_LABELS_GQL,
      variables: {
        input: {
          formId,
          server,
          token,
          project
        }
      }
    })
  }

  static async gitlabMilestones(formId: string, server: string, token: string, project: string) {
    return apollo.mutate({
      mutation: GITLAB_MILESTONES_GQL,
      variables: {
        input: {
          formId,
          server,
          token,
          project
        }
      }
    })
  }

  static async dropboxOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: DROPBOX_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async dropboxFolders(formId: string, appId: string) {
    return apollo.query({
      query: DROPBOX_FOLDERS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async slackOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: SLACK_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async slackChannels(formId: string, appId: string) {
    return apollo.query({
      query: SLACK_CHANNELS_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }

  static async notionOauth(formId: string, appId: string, code: string) {
    return apollo.mutate({
      mutation: NOTION_OAUTH_GQL,
      variables: {
        input: {
          formId,
          appId,
          code
        }
      }
    })
  }

  static async notionDatabases(formId: string, appId: string) {
    return apollo.query({
      query: NOTION_DATABASES_GQL,
      variables: {
        input: {
          formId,
          appId
        }
      }
    })
  }
}
