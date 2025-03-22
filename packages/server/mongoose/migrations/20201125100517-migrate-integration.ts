import { helper } from '@heyform-inc/utils'
import {
  AppModel,
  AppSchema,
  IntegrationModel,
  IntegrationSchema
} from '@model'
import { Connection } from 'mongoose'

export default {
  async up(mongoose: Connection) {
    const appModel = mongoose.model<AppModel>(AppModel.name, AppSchema)
    const integrationModel = mongoose.model<IntegrationModel>(
      IntegrationModel.name,
      IntegrationSchema
    )

    const integrations = await integrationModel.find()

    for (const row of integrations) {
      const integration: any = row.toObject()
      const uniqueId = integration.uniqueName

      if (helper.isEmpty(uniqueId)) {
        continue
      }

      const app = await appModel.findOne({
        uniqueId
      })

      if (app) {
        await integrationModel.updateOne(
          {
            _id: integration._id
          },
          {
            appId: app.id
          }
        )
      }
    }
  }
}
