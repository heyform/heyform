export interface ProjectModel {
  id: string
  teamId: string
  name: string
  ownerId: string
  members: string[]
  formCount: number
  isOwner?: boolean
}
