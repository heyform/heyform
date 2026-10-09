import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { getFilteredFields } from './utils'
import { Queue } from './utils/queue'
import { FormService } from '@/services'

import { useToast } from '@/components'
import { useFormStore } from '@/store'

import { useStoreContext } from './store'

export default function BuilderSync() {
  const { t } = useTranslation()
  const toast = useToast()
  const { state, dispatch } = useStoreContext()
  const { form, updateForm } = useFormStore()
  const queueRef = useRef<Queue | null>(null)
  const versionRef = useRef(form?.version ?? 0)

  const sync = useCallback(async () => {
    try {
      const currentForm = useFormStore.getState().form
      if (currentForm?.id === state.formId) {
        versionRef.current = Math.max(versionRef.current, currentForm.version ?? 0)
      }
      const { fields } = getFilteredFields(state.fields)
      const result = await FormService.updateFormSchemas({
        formId: state.formId,
        version: versionRef.current,
        drafts: fields,
        logics: state.logics || []
      })

      versionRef.current = result.version
      // A final save may finish after another form or a newer version has been opened.
      const latestForm = useFormStore.getState().form
      if (latestForm?.id === state.formId && result.version >= (latestForm.version ?? 0)) {
        updateForm(result)
      }
    } catch (err: any) {
      toast({ title: t('components.error.title'), message: err.message })
      throw err
    }
  }, [state.formId, state.fields, state.logics, updateForm, toast, t])

  useEffect(() => {
    const queue = new Queue()
    queueRef.current = queue
    queue.on(event => {
      dispatch({ type: 'setSyncing', payload: { isSyncing: event === 'start' } })
    })

    return () => {
      queue.dispose()
      queueRef.current = null
    }
  }, [dispatch])

  useEffect(() => {
    queueRef.current?.sync(sync)
  }, [sync])

  useEffect(() => {
    if (state.version > 0) {
      queueRef.current?.add()
    }
  }, [state.version])

  return null
}
