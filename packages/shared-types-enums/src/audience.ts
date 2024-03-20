export interface GroupModel {
  id: string
  teamId?: string
  name: string
  contactCount?: number
}

export interface ContactModel {
  id: string
  teamId: string
  fullName: string
  email: string
  jobTitle?: string
  avatar?: string
  phoneNumber?: string
  note?: string
  groups?: GroupModel[]
}
