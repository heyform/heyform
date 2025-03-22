import 'tsconfig-paths/register'
import { isEmail } from '@heyforms/answer-utils/helper'
import { EspoCRM } from '@heyforms/integrations'
import { UserModel, UserSchema } from '@model'
import { Connection } from 'mongoose'

const ESPOCRM_API_URL = 'https://crm.heyform.app/api/v1'
const ESPOCRM_API_KEY = '348ceb1740a565f588567e6b8a89da94'

export default {
  async up(mongoose: Connection) {
    const userModel = mongoose.model<UserModel>(UserModel.name, UserSchema)
    const users = await userModel.find()

    for (const user of users) {
      if (isEmail(user.email)) {
        const espoCRM = EspoCRM.init({
          server: ESPOCRM_API_URL,
          clientSecret: ESPOCRM_API_KEY
        })
        espoCRM.createContact(user.name, user.email!)
      }
    }
  }
}
