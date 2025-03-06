export interface AppModel {
  id: string
  uniqueId: string
  category: string
  name: string
  description?: string
  avatar?: string
  homepage?: string
  helpLinkUrl?: string
  attributes?: IMapType
  integration?: IntegrationModel
}

export interface IntegrationModel {
  appId: string
  attributes?: IMapType
  formId: string
  status: number
}
