import { htmlUtils } from '@heyform-inc/answer-utils'
import type { FormModel } from '@heyform-inc/shared-types-enums'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { type FC, useEffect, useMemo, useReducer, useState } from 'react'

import { Async } from '@/components'
import { IFormField } from '@/components/formComponents/typings'
import { Spin, notification } from '@/components/ui'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

import type { IState } from './store'
import { StoreContext, storeReducer } from './store'
import './style.scss'
import { initFields } from './utils'
import { Queue } from './utils/queue'
import { Compose } from './views/Compose'
import { LeftSidebar } from './views/LeftSidebar'
import { LogicBulkEditPanel } from './views/LogicBulkEditPanel'
import { LogicFlow } from './views/LogicFlow'
import { LogicPanel } from './views/LogicPanel'
import { RightSidebar } from './views/RightSidebar'
import { VariablePanel } from './views/VariablePanel'

const FormBuilder: FC<{ form: FormModel }> = ({ form }) => {
  const formStore = useStore('formStore')
  const initialState: IState = {
    formId: form.id,
    version: 0,
    references: [],
    activeTabName: 'question',
    variables: form.variables,
    locale: form.settings?.locale || 'en',
    hiddenFields: form.hiddenFields || [],
    ...initFields(form.fields, form.logics)
  }
  const [state, dispatch] = useReducer(storeReducer, initialState)
  const store = useMemo(() => ({ state, dispatch }), [state])

  const queue = useMemo(() => {
    return new Queue({
      concurrency: 1,
      scheduleInterval: 1_000,
      taskIntervalTime: 10_000
    })
  }, [form.id])

  function getUpdates(fields?: IFormField[]) {
    const result = {
      fields: [] as IFormField[]
    }

    if (helper.isValidArray(fields)) {
      for (const row of fields!) {
        const field: IFormField = {
          id: row.id,
          kind: row.kind,
          title: htmlUtils.parse(row.title! as string),
          description: htmlUtils.parse(row.description! as string),
          validations: row.validations,
          properties: row.properties,
          layout: row.layout
        }

        if (row.kind === FieldKindEnum.GROUP) {
          field.properties = {
            ...field.properties,
            ...getUpdates(row.properties?.fields)
          }
        }

        result.fields.push(field)
      }
    }

    return result
  }

  async function syncForm() {
    try {
      await FormService.updateFormSchemas(form.id, getUpdates(state.fields!))
    } catch (err: any) {
      notification.error({
        message: 'Error',
        title: err.message
      })
    }
  }

  function visibilityListener() {
    if (document.visibilityState === 'hidden') {
      syncForm()
    }
  }

  useEffect(() => {
    formStore.update({
      logics: state.logics,
      variables: state.variables
    })
  }, [state.logics, state.variables])

  useEffect(() => {
    formStore.update(getUpdates(state.fields!))

    // Add to queue
    if (state.version > 0) {
      queue.add(async () => {
        await syncForm()
      })
    }

    document.addEventListener('visibilitychange', visibilityListener)

    return () => {
      document.removeEventListener('visibilitychange', visibilityListener)
    }
  }, [state.version])

  return (
    <StoreContext.Provider value={store}>
      <>
        <div className="form-builder">
          {state.activeTabName === 'logic' ? (
            <LogicFlow />
          ) : (
            <>
              <LeftSidebar />
              <Compose />
            </>
          )}
          <RightSidebar />
          {state.isLogicPanelOpen && <LogicPanel />}
          {state.isVariablePanelOpen && <VariablePanel />}
          {state.isBulkEditPanelOpen && <LogicBulkEditPanel />}
        </div>

        <div className="flex h-full items-center justify-center px-8 text-center md:hidden">
          Please edit the form via the web page on your computer.
        </div>
      </>
    </StoreContext.Provider>
  )
}

const FormCreate = () => {
  const { formId } = useParam()
  const [form, setForm] = useState<FormModel>()

  async function request() {
    const result: FormModel = await FormService.detail(formId)
    setForm(result)
    return true
  }

  const Skeleton = (
    <div className="flex h-full items-center justify-center text-blue-700">
      <Spin />
    </div>
  )

  return (
    <Async className="h-full" request={request} skeleton={Skeleton} deps={[formId]}>
      {form && <FormBuilder form={form!} />}
    </Async>
  )
}

export default FormCreate
