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

  const sync = useCallback(async () => {
    try {
      const { fields } = getFilteredFields(state.fields)
      const result = await FormService.updateFormSchemas({
        formId: state.formId,
        version: form?.version as number,
        drafts: fields
      })

      updateForm(result)
    } catch (err: any) {
      toast({ title: t('components.error.title'), message: err.message })
      throw err
    }
  }, [state.formId, state.fields, form?.version, updateForm, toast, t])

  useEffect(() => {
    const queue = new Queue()
    queueRef.current = queue
    queue.on(event => {
      dispatch({ type: 'setSyncing', payload: { isSyncing: event === 'start' } })
    })

    return () => {
      queue.clear()
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
