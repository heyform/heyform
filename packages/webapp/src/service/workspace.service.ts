import {
  CREATE_WORKSPACE_GQL,
  DISSOLVE_WORKSPACE_CODE_GQL,
  DISSOLVE_WORKSPACE_GQL,
  INVITE_MEMBERS_GQL,
  JOIN_WORKSPACE_GQL,
  LEAVE_WORKSPACE_GQL,
  PUBLIC_WORKSPACE_DETAIL_GQL,
  REMOVE_WORKSPACE_MEMBER_GQL,
  RESET_WORKSPACE_INVITE_CODE_GQL,
  TRANSFER_WORKSPACE_GQL,
  UPDATE_WORKSPACE_GQL,
  WORKSPACES_GQL,
  WORKSPACE_MEMBERS_GQL
} from '@/consts'
import { request } from '@/utils'

export class WorkspaceService {
  static async create(name: string, avatar?: string) {
    return request.mutate({
      mutation: CREATE_WORKSPACE_GQL,
      variables: {
        input: {
          name,
          avatar
        }
      }
    })
  }

  static async publicDetail(teamId: string, inviteCode: string) {
    return request.query({
      query: PUBLIC_WORKSPACE_DETAIL_GQL,
      variables: {
        input: {
          teamId,
          inviteCode
        }
      }
    })
  }

  static update(input: { teamId: string } & IMapType) {
    return request.mutate({
      mutation: UPDATE_WORKSPACE_GQL,
      variables: {
        input
      }
    })
  }

  static dissolveCode(teamId: string) {
    return request.query({
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
    return request.mutate({
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
    return request.query({
      query: WORKSPACES_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static async members(teamId: string) {
    return request.query({
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
    return request.mutate({
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
    return request.mutate({
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
    return request.mutate({
      mutation: LEAVE_WORKSPACE_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static join(teamId: string, inviteCode: string) {
    return request.mutate({
      mutation: JOIN_WORKSPACE_GQL,
      variables: {
        input: {
          teamId,
          inviteCode
        }
      }
    })
  }

  static refreshInvitationCode(teamId: string) {
    return request.mutate({
      mutation: RESET_WORKSPACE_INVITE_CODE_GQL,
      variables: {
        input: {
          teamId
        }
      }
    })
  }

  static sendInvites(teamId: string, emails: string[]) {
    return request.mutate({
      mutation: INVITE_MEMBERS_GQL,
      variables: {
        input: {
          teamId,
          emails
        }
      }
    })
  }
}
