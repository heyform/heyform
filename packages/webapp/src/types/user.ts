export interface UserType {
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
  isAssigned?: boolean
  isOwner?: boolean
  isYou?: boolean
  isOnboarded: boolean
}
