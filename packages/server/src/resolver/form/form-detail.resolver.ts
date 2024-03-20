import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { FormDetailInput, FormType, PublicFormType } from '@graphql'
import { FormModel } from '@model'
import { AppService, FormService, IntegrationService } from '@service'

@Resolver()
export class FormDetailResolver {
  constructor(
    private readonly appService: AppService,
    private readonly formService: FormService,
    private readonly integrationService: IntegrationService
  ) {}

  @Query(returns => FormType)
  @FormGuard()
  @Auth()
  async formDetail(@Args('input') input: FormDetailInput): Promise<FormModel> {
    return this.formService.findById(input.formId)
  }

  @Query(returns => PublicFormType)
  async publicForm(@Args('input') input: FormDetailInput): Promise<PublicFormType> {
    const form = await this.formService.findPublicForm(input.formId)
    const integrations: Record<string, any> = {}

    if (form.settings.active) {
      const apps = await this.appService.findAllByUniqueIds(['googleanalytics', 'facebookpixel'])
      const result = await this.integrationService.findAllInFormByApps(
        input.formId,
        apps.map(app => app.id)
      )

      for (const row of result) {
        const app = apps.find(app => app.id === row.appId)
        integrations[app.uniqueId] = (row.attributes as any).get('trackingCode')
      }
    }

    return {
      ...form,
      integrations
    }
  }
}
