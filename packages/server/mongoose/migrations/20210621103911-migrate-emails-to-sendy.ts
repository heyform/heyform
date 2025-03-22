import 'tsconfig-paths/register'
import { isEmail } from '@heyforms/answer-utils/helper'
import { Sendy } from '@heyforms/integrations'
import { UserModel, UserSchema } from '@model'
import { Connection } from 'mongoose'

const SENDY_API_URL = 'https://heymail.me'
const SENDY_LIST = 'Avfjli5pk9KqkRwtd763lYiw'
const SENDY_API_KEY = 'bhayIFrP2nqEReoCUHgf'

export default {
  async up(mongoose: Connection) {
    const userModel = mongoose.model<UserModel>(UserModel.name, UserSchema)
    const users = await userModel.find()

    for (const user of users) {
      if (isEmail(user.email)) {
        const sendy = Sendy.init({
          server: SENDY_API_URL,
          clientSecret: SENDY_API_KEY
        })
        sendy.subscribe(SENDY_LIST, user.email!)
      }
    }
  }
}
