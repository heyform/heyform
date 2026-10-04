import { FC, useMemo, useReducer } from 'react'

import { initFields } from './utils'
import { FormService } from '@/services'
import { useParam } from '@/utils'

import { Async } from '@/components'
import { WorkspaceGuard } from '@/layouts'
import { useFormStore } from '@/store'
import '@/styles/builder.scss'
import { FormType } from '@/types'

import BuilderCompose from './Compose'
import HiddenFieldsModal from './HiddenFieldsModal'
import BuilderLeftSidebar, { BuilderLeftSidebarModal } from './LeftSidebar'
import QuestionTypesModal from './LeftSidebar/QuestionTypesModal'
import LogicBulkEditModal from './LogicBulkEditModal'
import LogicFlow from './LogicFlow'
import LogicModal from './LogicModal'
import BuilderNavBar from './NavBar'
import PreviewModal from './PreviewModal'
import BuilderRightSidebar from './RightSidebar'
import VariableModal from './VariableModal'
import { IState, StoreContext, storeReducer } from './store'
import BuilderSync from './Sync'

interface IBuilderProps {
  form: FormType
}

const Skeleton = () => (
  <div className="bg-background flex h-screen flex-col">
    <div className="h-14"></div>
    <main className="flex h-[calc(100vh-3.5rem)] flex-1 gap-2 px-2 pb-2"></main>
  </div>
)

const Builder: FC<IBuilderProps> = ({ form }) => {
  const initialState: IState = {
    formId: form.id,
    version: 0,
    references: [],
    activeTabName: 'question',
    variables: form.variables,
    locale: form.settings?.locale || 'en',
    hiddenFields: form.hiddenFields || [],
    ...initFields(form.drafts, form.logics)
  }
  const [state, dispatch] = useReducer(storeReducer, initialState)
  const store = useMemo(() => ({ state, dispatch }), [state])

  return (
    <StoreContext.Provider value={store}>
      <BuilderSync />
      <div className="bg-background flex h-screen flex-col">
        <BuilderNavBar />

        <main className="flex h-[calc(100vh-3.5rem)] flex-1 sm:gap-2 sm:px-2 sm:pb-2">
          {state.activeTabName === 'logic' ? (
            <LogicFlow />
          ) : (
            <>
              <BuilderLeftSidebar />
              <BuilderCompose />
            </>
          )}
          <BuilderRightSidebar />
        </main>
      </div>

      <BuilderLeftSidebarModal />
      <QuestionTypesModal />
      <PreviewModal />
      <HiddenFieldsModal />
      <VariableModal />
      <LogicModal />
      <LogicBulkEditModal />
    </StoreContext.Provider>
  )
}

export default function FormBuilder() {
  const { formId } = useParam()
  const { form, setForm } = useFormStore()

  async function fetch() {
    setForm(await FormService.detail(formId))

    return true
  }

  return (
    <WorkspaceGuard>
      <Async fetch={fetch} loader={<Skeleton />} refreshDeps={[formId]}>
        {form && <Builder form={form} />}
      </Async>
    </WorkspaceGuard>
  )
}
