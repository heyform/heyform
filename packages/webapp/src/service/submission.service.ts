import { Answer, SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'

import {
  DELETE_SUBMISSIONS_GQL,
  SUBMISSIONS_GQL,
  SUBMISSION_ANSWERS_GQL,
  SUBMISSION_LOCATIONS_GQL,
  UPDATE_SUBMISSIONS_CATEGORY_GQL,
  UPDATE_SUBMISSION_ANSWER_GQL
} from '@/consts'
import { request } from '@/utils'

export class SubmissionService {
  static submissions(input: { formId: string; category: string; page: number }) {
    return request.query({
      query: SUBMISSIONS_GQL,
      variables: {
        input
      }
    })
  }

  static updateCategory(input: {
    formId: string
    submissionIds: string[]
    category: SubmissionCategoryEnum
  }) {
    return request.mutate({
      mutation: UPDATE_SUBMISSIONS_CATEGORY_GQL,
      variables: {
        input
      }
    })
  }

  static delete(formId: string, submissionIds: string[]) {
    return request.mutate({
      mutation: DELETE_SUBMISSIONS_GQL,
      variables: {
        input: {
          formId,
          submissionIds
        }
      }
    })
  }

  static updateAnswer(input: { formId: string; submissionId: string; answer: Answer }) {
    return request.mutate({
      mutation: UPDATE_SUBMISSION_ANSWER_GQL,
      variables: {
        input
      }
    })
  }

  static locations(input: { formId: string; start: string; end: string }) {
    return request.query({
      query: SUBMISSION_LOCATIONS_GQL,
      variables: {
        input
      }
    })
  }

  static answers(input: { formId: string; fieldId: string; page: number }) {
    return request.query({
      query: SUBMISSION_ANSWERS_GQL,
      variables: {
        input
      }
    })
  }
}
