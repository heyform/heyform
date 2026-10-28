import { APP_HOMEPAGE_URL } from '@environments'
import { AppAuthType, AppType } from '@graphql'
import { Query, Resolver } from '@nestjs/graphql'
import { AppService } from '@service'

import { AppDefinition } from '../../apps/types'

@Resolver()
export class AppsResolver {
  constructor(private readonly appService: AppService) {}

  @Query(returns => [AppType])
  async apps(): Promise<AppType[]> {
    // Apps whose OAuth2 provider isn't configured on this install are hidden
    return this.appService.findAllAvailable().map(app => ({
      ...app,
      icon: APP_HOMEPAGE_URL + app.icon,
      auth: this.toAuthType(app),
      deliversSubmissions: !!app.run,
      settings: app.settings.map(setting => ({
        ...setting,
        loadsOptions: setting.type === 'select' && !!setting.loadOptions
      }))
    }))
  }

  private toAuthType(app: AppDefinition): AppAuthType {
    const auth = app.auth

    switch (auth.type) {
      case 'apiKey':
        return { type: auth.type, label: auth.label, description: auth.description }

      case 'oauth2':
        return {
          type: auth.type,
          provider: auth.provider,
          providerName: this.appService.findOAuth2Provider(app)?.name
        }

      default:
        return { type: auth.type }
    }
  }
}
