import { ProjectModel } from '@/models/project'
import { UserModel } from '@/models/user'

export interface WorkspaceModel {
  id: string
  name: string
  ownerId: string
  avatar?: string
  enableCustomDomain?: boolean
  inviteCode: string
  inviteCodeExpireAt?: number
  allowJoinByInviteLink: boolean
  storageQuota: number
  memberCount: number
  additionalSeats: number
  projects: ProjectModel[]
  members: UserModel[]
  isOwner?: boolean
  owner?: UserModel
  createdAt?: number
}

export interface WorkspaceMemberModel {
  id: string
  name: string
  email: string
  avatar: string
  isOwner: boolean
  lastSeenAt?: number
}
