import { LOGIN_GQL, RESET_PASSWORD_GQL, SEND_RESET_EMAIL_GQL, SIGN_UP_GQL } from '@/consts'
import { apollo } from '@/utils'

export class AuthService {
  static async login(input: { email: string; password: string }) {
    return apollo.mutate({
      mutation: LOGIN_GQL,
      variables: {
        input
      }
    })
  }

  static signUp(input: { name: string; email: string; password: string }) {
    return apollo.query({
      query: SIGN_UP_GQL,
      variables: {
        input
      }
    })
  }

  static sendResetEmail(email: string) {
    return apollo.mutate({
      mutation: SEND_RESET_EMAIL_GQL,
      variables: {
        input: {
          email
        }
      }
    })
  }

  static resetPassword(input: { email: string; password: string; code: string }) {
    return apollo.mutate({
      mutation: RESET_PASSWORD_GQL,
      variables: {
        input
      }
    })
  }
}
