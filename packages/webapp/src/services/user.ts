import {
  CANCEL_USER_DELETION_GQL,
  CHANGE_EMAIL_CODE_GQL,
  EMAIL_VERIFICATION_CODE_GQL,
  UPDATE_EMAIL_GQL,
  UPDATE_USER_DETAIL_GQL,
  UPDATE_USER_PASSWORD_GQL,
  USER_CDN_TOKEN_GQL,
  USER_DELETION_CODE_GQL,
  USER_DETAILS_GQL,
  VERIFY_EMAIL_GQL,
  VERIFY_USER_DELETION_GQL
} from '@/consts'
import { apollo } from '@/utils'

export class UserService {
  static async userDetail() {
    return apollo.query({
      query: USER_DETAILS_GQL
    })
  }

  static update(input: {
    name?: string
    avatar?: string
    restoreGravatar?: boolean
    isOnboarded?: boolean
  }) {
    return apollo.mutate({
      mutation: UPDATE_USER_DETAIL_GQL,
      variables: {
        input
      }
    })
  }

  static changeEmailCode(email: string) {
    return apollo.mutate({
      mutation: CHANGE_EMAIL_CODE_GQL,
      variables: {
        input: {
          email
        }
      }
    })
  }

  static updateEmail(email: string, code: string) {
    return apollo.mutate({
      mutation: UPDATE_EMAIL_GQL,
      variables: {
        input: {
          email,
          code
        }
      }
    })
  }

  static verifyEmail(code: string) {
    return apollo.mutate({
      mutation: VERIFY_EMAIL_GQL,
      variables: {
        input: {
          code
        }
      }
    })
  }

  static updatePassword(currentPassword: string, newPassword: string) {
    return apollo.mutate({
      mutation: UPDATE_USER_PASSWORD_GQL,
      variables: {
        input: {
          currentPassword,
          newPassword
        }
      }
    })
  }

  static emailVerificationCode() {
    return apollo.query({
      query: EMAIL_VERIFICATION_CODE_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static async cdnToken(filename: string, mime: string) {
    return apollo.query({
      query: USER_CDN_TOKEN_GQL,
      variables: {
        input: {
          filename,
          mime
        }
      },
      fetchPolicy: 'network-only'
    })
  }

  static sendDeletionCode() {
    return apollo.query({
      query: USER_DELETION_CODE_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static verifyDeletionCode(code: string) {
    return apollo.mutate({
      mutation: VERIFY_USER_DELETION_GQL,
      variables: {
        input: {
          code
        }
      }
    })
  }

  static cancelDeletion() {
    return apollo.mutate({
      mutation: CANCEL_USER_DELETION_GQL
    })
  }
}
