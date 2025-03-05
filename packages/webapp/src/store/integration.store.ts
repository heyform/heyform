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
    this.integrations = [...this.integrations, ...integrations]
  }

  addIntegrations(formId: string, appId: string, data: Record<string, any>) {
    this.integrations.push({ formId: formId, appId: appId, attributes: data, status: 1 })
  }

  deleteIntegrations(appId: string, updates: Record<string, any>) {
    const app = this.apps.find(w => w.id === appId)

    if (app) {
      Object.assign(app, updates)
    } else {
      console.log('App not found')
    }
  }
}
