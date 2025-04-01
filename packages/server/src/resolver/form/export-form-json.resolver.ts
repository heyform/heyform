import { Auth, Form, FormGuard } from '@decorator'
import { ExportFormToJSONInput } from '@graphql'
import { FormModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@Resolver()
@Auth()
export class ExportFormJsonResolver {
  @Query(returns => GraphQLJSONObject)
  @FormGuard()
  async exportFormToJSON(
    @Form() form: FormModel,
    @Args('input') input: ExportFormToJSONInput
  ): Promise<Record<string, any>> {
    // Create a JSON serializable version of the form
    // Explicitly extract only the fields we want to include
    const exportedForm = {
      name: form.name,
      fields: form.fields || [],
      hiddenFields: form.hiddenFields || [],
      logics: form.logics || [],
      variables: form.variables || [],
      settings: form.settings || {},
      themeSettings: form.themeSettings || {},
      interactiveMode: form.interactiveMode,
      kind: form.kind
      // Translations are skipped in this implementation
    }

    return exportedForm
  }
}
