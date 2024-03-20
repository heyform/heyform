import {
  CANCEL_USER_DELETION_GQL,
  CHANGE_EMAIL_CODE_GQL,
  EMAIL_VERIFICATION_CODE_GQL,
  UPDATE_EMAIL_GQL,
  UPDATE_USER_DETAIL_GQL,
  UPDATE_USER_PASSWORD_GQL,
  USER_DELETION_CODE_GQL,
  USER_DETAILS_GQL,
  VERIFY_EMAIL_GQL,
  VERIFY_USER_DELETION_GQL
} from '@/consts'
import { request } from '@/utils'

export class UserService {
  static async userDetail() {
    return request.query({
      query: USER_DETAILS_GQL
    })
  }

  static update(input: { name?: string; avatar?: string; restoreGravatar?: boolean }) {
    return request.mutate({
      mutation: UPDATE_USER_DETAIL_GQL,
      variables: {
        input
      }
    })
  }

  static changeEmailCode(password: string, email: string) {
    return request.mutate({
      mutation: CHANGE_EMAIL_CODE_GQL,
      variables: {
        input: {
          password,
          email
        }
      }
    })
  }

  // Don't need to enter password when change email address
  static updateEmail(email: string, password: string, code: string) {
    return request.mutate({
      mutation: UPDATE_EMAIL_GQL,
      variables: {
        input: {
          email,
          // password,
          code
        }
      }
    })
  }

  static verifyEmail(code: string) {
    return request.mutate({
      mutation: VERIFY_EMAIL_GQL,
      variables: {
        input: {
          code
        }
      }
    })
  }

  static updatePassword(currentPassword: string, newPassword: string) {
    return request.mutate({
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
    return request.query({
      query: EMAIL_VERIFICATION_CODE_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static sendDeletionCode() {
    return request.query({
      query: USER_DELETION_CODE_GQL,
      fetchPolicy: 'network-only'
    })
  }

  static verifyDeletionCode(code: string) {
    return request.mutate({
      mutation: VERIFY_USER_DELETION_GQL,
      variables: {
        input: {
          code
        }
      }
    })
  }

  static cancelDeletion() {
    return request.mutate({
      mutation: CANCEL_USER_DELETION_GQL
    })
  }
}
