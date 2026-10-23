import { Injectable, OnModuleInit } from '@nestjs/common'

import { Logger } from '@utils'

import * as apps from '../apps'
import {
  ConfiguredOAuth2Provider,
  OAuth2Provider,
  oauth2Providers,
  readOAuth2Credentials
} from '../apps/oauth2-providers'
import { AppDefinition } from '../apps/types'
import { IntegrationSecrets, integrationSecrets } from './integration-secrets'

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name)
  private readonly apps: Record<string, AppDefinition> = apps
  providers: Record<string, OAuth2Provider> = oauth2Providers
  // Credentials are stored with INTEGRATION_ENCRYPTION_KEY
  secrets: IntegrationSecrets = integrationSecrets

  onModuleInit() {
    const needKey = this.findAll().filter(app => app.auth.type !== 'none')

    if (needKey.length && !this.secrets.isConfigured) {
      this.logger.warn(
        `INTEGRATION_ENCRYPTION_KEY is not set, so integrations that store credentials are unavailable: ${needKey
          .map(app => app.name)
          .join(', ')}. Set it to a long random value to enable them.`
      )
    }
  }

  findAll(): AppDefinition[] {
    return Object.values(this.apps)
  }

  // Apps the form owner can set up on this install
  findAllAvailable(): AppDefinition[] {
    return this.findAll().filter(app => this.isAvailable(app))
  }

  findById(id: string): AppDefinition | undefined {
    // Own properties only, so ids like `constructor` don't resolve to Object members
    return Object.prototype.hasOwnProperty.call(this.apps, id) ? this.apps[id] : undefined
  }

  // An app that stores credentials needs INTEGRATION_ENCRYPTION_KEY, and an
  // oauth2 app its provider's client credentials too
  isAvailable(app: AppDefinition): boolean {
    if (app.auth.type === 'none') {
      return true
    }

    return (
      this.secrets.isConfigured && (app.auth.type !== 'oauth2' || !!this.findOAuth2Provider(app))
    )
  }

  findOAuth2Provider(app: AppDefinition): ConfiguredOAuth2Provider | undefined {
    if (app.auth.type === 'oauth2') {
      return this.findProvider(app.auth.provider)
    }
  }

  // A provider with its client credentials, if they're set
  findProvider(providerId: string): ConfiguredOAuth2Provider | undefined {
    const provider = Object.prototype.hasOwnProperty.call(this.providers, providerId)
      ? this.providers[providerId]
      : undefined
    const credentials = provider && readOAuth2Credentials(provider.id)

    if (provider && credentials) {
      return { ...provider, ...credentials }
    }
  }
}
