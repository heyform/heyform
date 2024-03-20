import { makeAutoObservable } from 'mobx'

import { AppModel, IntegrationModel } from '@/models'

import { mobxStorage } from './mobxStorage'

export class IntegrationStore {
  apps: AppModel[] = []

  integrations: IntegrationModel[] = []

  constructor() {
    makeAutoObservable(this)
    mobxStorage(this, 'IntegrationStore', ['apps'])
  }

  get integratedApps() {
    return this.apps.map(app => {
      app.integration = this.integrations.find(row => row.appId === app.id)
      return app
    })
  }

  setApps(apps: AppModel[] = []) {
    apps.sort((x, y) => (x.category > y.category ? 1 : -1))
    this.apps = apps
  }

  setIntegrations(integrations: IntegrationModel[]) {
    this.integrations = integrations
  }
}
