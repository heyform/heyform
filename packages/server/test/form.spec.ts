import {
  FormKindEnum,
  FormStatusEnum,
  InteractiveModeEnum
} from '@heyform-inc/shared-types-enums'
import { INestApplication } from '@nestjs/common'
import users from './fixtures/users'
import {
  CREATE_FORM,
  DELETE_FORM,
  DUPLICATE_FORM,
  FORM_DETAIL,
  FORMS,
  MOVE_FORM_TO_TRASH,
  UPDATE_FORM,
  UPDATE_FORM_FIELD,
  UPDATE_FORM_FIELDS,
  UPDATE_FORM_LOGICS,
  UPDATE_FORM_VARIABLES
} from './graphql'
import { _test, getApp } from './utils'

describe('Form', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await getApp()
    await app.init()
  })

  test('owner should create form', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: CREATE_FORM,
          variables: {
            input: {
              projectId: users.owner.projectId,
              name: 'form-owner-02',
              interactiveMode: InteractiveModeEnum.GENERAL,
              kind: FormKindEnum.SURVEY
            }
          }
        })
        .expect(200)
        .expect(res => {
          const formId = res.body.data.createForm
          users.owner.CACHE_FORM_ID = formId
          expect(formId.length).toBe(8)
        })
    })
  })

  test('member should create form', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: CREATE_FORM,
          variables: {
            input: {
              projectId: users.member.projectId,
              name: 'form-member-03',
              nameSchema: ['form-member-03'],
              interactiveMode: InteractiveModeEnum.GENERAL,
              kind: FormKindEnum.SURVEY
            }
          }
        })
        .expect(200)
        .expect(res => {
          const formId = res.body.data.createForm
          users.member.CACHE_FORM_ID = formId
          expect(formId.length).toBe(8)
        })
    })
  })

  test('member should list forms', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: FORMS,
          variables: {
            input: {
              projectId: users.owner.projectId,
              status: FormStatusEnum.NORMAL
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.forms.map(row => row.id)).toContain(
            users.owner.formId
          )
        })
    })
  })

  test('member should move form to trash', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: MOVE_FORM_TO_TRASH,
          variables: {
            input: {
              formId: users.owner.CACHE_FORM_ID
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            moveFormToTrash: true
          }
        })
    })
  })

  test('member should update form fields', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_FORM_FIELDS,
          variables: {
            input: {
              formId: users.owner.formId,
              fields: [
                {
                  id: 'member_field_01',
                  title: ['short text'],
                  kind: 'short_text',
                  validations: {
                    required: true
                  }
                }
              ]
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateFormSchemas: true
          }
        })
    })
  })

  test('member should update one form field', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_FORM_FIELD,
          variables: {
            input: {
              formId: users.owner.formId,
              fieldId: 'member_field_01',
              updates: {
                frozen: true
              }
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateFormField: true
          }
        })
    })
  })

  test('member should update form', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_FORM,
          variables: {
            input: {
              formId: users.owner.formId,
              active: true
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateForm: true
          }
        })
    })
  })

  test('member should update form logics', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_FORM_LOGICS,
          variables: {
            input: {
              formId: users.owner.formId,
              logics: {
                fieldId: 'member_field_01',
                payloads: [
                  {
                    id: 'a',
                    condition: {
                      comparison: 'is',
                      expected: 'hello'
                    },
                    action: {
                      kind: 'navigate',
                      fieldId: 'f5'
                    }
                  },
                  {
                    id: 'a2',
                    condition: {
                      comparison: 'is',
                      ref: 'f1'
                    },
                    action: {
                      kind: 'calculate',
                      variable: 'v1',
                      operator: 'addition',
                      value: 5
                    }
                  },
                  {
                    id: 'a3',
                    condition: {
                      comparison: 'is_empty'
                    },
                    action: {
                      kind: 'calculate',
                      variable: 'v2',
                      operator: 'addition',
                      ref: 'f1'
                    }
                  }
                ]
              }
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateFormLogics: true
          }
        })
    })
  })

  test('member should update form variables', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_FORM_VARIABLES,
          variables: {
            input: {
              formId: users.owner.formId,
              variables: [
                {
                  id: 'v1',
                  kind: 'number',
                  name: 'v1',
                  value: 0
                },
                {
                  id: 'v2',
                  kind: 'string',
                  name: 'v2',
                  value: ''
                }
              ]
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateFormVariables: true
          }
        })
    })
  })

  test('owner should get form detail', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: FORM_DETAIL,
          variables: {
            input: {
              formId: users.owner.formId
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.formDetail.fields[0].id).toBe('member_field_01')
          expect(res.body.data.formDetail.fields[0].kind).toBe('short_text')
          expect(res.body.data.formDetail.fields[0].frozen).toBe(true)
        })
    })
  })

  test('member should duplicate form', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: DUPLICATE_FORM,
          variables: {
            input: {
              formId: users.owner.formId
            }
          }
        })
        .expect(200)
        .expect(res => {
          const formId = res.body.data.duplicateForm
          users.owner.CACHE_DUPLICATE_FORM_ID = formId
          expect(formId.length).toBe(8)
        })
    })
  })

  test('member should get duplicate form detail', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: FORM_DETAIL,
          variables: {
            input: {
              formId: users.owner.CACHE_DUPLICATE_FORM_ID
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.formDetail.name).toContain('🍔 Owner (copy)')
          expect(res.body.data.formDetail.fields[0].id).toBe('member_field_01')
          expect(res.body.data.formDetail.fields[0].kind).toBe('short_text')
        })
    })
  })

  test('owner should delete form', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: DELETE_FORM,
          variables: {
            input: {
              formId: users.owner.CACHE_DUPLICATE_FORM_ID
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            deleteForm: true
          }
        })
    })
  })

  test('member should delete form', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: DELETE_FORM,
          variables: {
            input: {
              formId: users.owner.CACHE_FORM_ID
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            deleteForm: true
          }
        })
    })
  })
})
