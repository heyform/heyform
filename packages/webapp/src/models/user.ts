export interface UserModel {
  id: string
  name: string
  email: string
  phoneNumber: string
  avatar: string
  note: string
  lastSeenAt?: number
  isSocialAccount?: boolean
  isEmailVerified?: boolean
  isDeletionScheduled?: boolean
  deletionScheduledAt?: number
  status: number
  createdAt: string
  updatedAt: string

  // Only for project members
  isAssigned?: boolean
  isOwner?: boolean
  isSelf?: boolean
}
