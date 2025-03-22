import {
  ADD_CUSTOM_DOMAIN_GQL,
  CREATE_BRAND_KIT_GQL,
  CREATE_WORKSPACE_GQL,
  DISSOLVE_WORKSPACE_CODE_GQL,
  DISSOLVE_WORKSPACE_GQL,
  EXPORT_WORKSPACE_DATA_GQL,
  INVITE_MEMBERS_GQL,
  JOIN_WORKSPACE_GQL,
  LEAVE_WORKSPACE_GQL,
  PUBLIC_WORKSPACE_DETAIL_GQL,
  REMOVE_WORKSPACE_MEMBER_GQL,
  RESET_WORKSPACE_INVITE_CODE_GQL,
  SEARCH_WORKSPACE_GQL,
  TRANSFER_WORKSPACE_GQL,
  UPDATE_BRAND_KIT_GQL,
  UPDATE_WORKSPACE_GQL,
  WORKSPACES_GQL,
  WORKSPACE_CDN_TOKEN_GQL,
  WORKSPACE_MEMBERS_GQL,
  WORKSPACE_RECENT_FORMS_GQL,
  WORKSPACE_SUBSCRIPTION_GQL
} from '@/consts'
import { BrandKitType } from '@/types'
import { apollo } from '@/utils'

export class WorkspaceService {
  static async create(input: { name: string; avatar?: string; projectName: string }) {
    return apollo.mutate({
      mutation: CREATE_WORKSPACE_GQL,
      variables: {
        input
      }
    })
  }

  static async publicDetail(teamId: string, inviteCode: string) {
    return apollo.query({
      query: PUBLIC_WORKSPACE_DETAIL_GQL,
      variables: {
        input: {
          teamId,
          inviteCode
        }
      }
    })
  }

  static update(teamId: string, updates: AnyMap) {
    return apollo.mutate({
      mutation: UPDATE_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          ...updates
        }
      }
    })
  }

  static dissolveCode(teamId: string) {
    return apollo.query({
      query: DISSOLVE_WORKSPACE_CODE_GQL,
      variables: {
        input: {
          teamId
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static dissolve(teamId: string, code: string) {
    return apollo.mutate({
      mutation: DISSOLVE_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          code
        }
      }
    })
  }

  static async workspaces() {
    return apollo.query({
      query: WORKSPACES_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static async subscription(teamId: string) {
    return apollo.query({
      query: WORKSPACE_SUBSCRIPTION_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static async recentForms(teamId: string) {
    return apollo.query({
      query: WORKSPACE_RECENT_FORMS_GQL,
      variables: {
        input: {
          teamId,
          limit: 10
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static async members(teamId: string) {
    return apollo.query({
      query: WORKSPACE_MEMBERS_GQL,
      variables: {
        input: {
          teamId
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static removeMember(teamId: string, memberId: string) {
    return apollo.mutate({
      mutation: REMOVE_WORKSPACE_MEMBER_GQL,
      variables: {
        input: {
          teamId,
          memberId
        }
      }
    })
  }

  static transfer(teamId: string, memberId: string) {
    return apollo.mutate({
      mutation: TRANSFER_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          memberId
        }
      }
    })
  }

  static leave(teamId: string) {
    return apollo.mutate({
      mutation: LEAVE_WORKSPACE_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static join(teamId: string, inviteCode: string) {
    return apollo.mutate({
      mutation: JOIN_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          inviteCode
        }
      }
    })
  }

  static async cdnToken(teamId: string, filename: string, mime: string) {
    return apollo.query({
      query: WORKSPACE_CDN_TOKEN_GQL,
      variables: {
        input: {
          teamId,
          filename,
          mime
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static refreshInvitationCode(teamId: string) {
    return apollo.mutate({
      mutation: RESET_WORKSPACE_INVITE_CODE_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static sendInvites(teamId: string, emails: string[]) {
    return apollo.mutate({
      mutation: INVITE_MEMBERS_GQL,
      variables: {
        input: {
          teamId,
          emails
        }
      }
    })
  }

  static async addCustomDomain(teamId: string, domain: string) {
    return apollo.mutate({
      mutation: ADD_CUSTOM_DOMAIN_GQL,
      variables: {
        input: {
          teamId,
          domain
        }
      }
    })
  }

  static exportData(teamId: string) {
    return apollo.mutate({
      mutation: EXPORT_WORKSPACE_DATA_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static createBrandKit(input: { teamId: string } & Omit<BrandKitType, 'id'>) {
    return apollo.mutate({
      mutation: CREATE_BRAND_KIT_GQL,
      variables: {
        input
      }
    })
  }

  static updateBrandKit(input: { teamId: string } & Partial<BrandKitType>) {
    return apollo.mutate({
      mutation: UPDATE_BRAND_KIT_GQL,
      variables: {
        input
      }
    })
  }

  static search(teamId: string, query: string) {
    return apollo.query({
      query: SEARCH_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          query
        }
      }
    })
  }
}
