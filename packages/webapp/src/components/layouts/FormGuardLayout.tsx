import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'

import { WorkspaceGuard } from '@/components'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useParam } from '@/utils'

const FormGuard: FC<IComponentProps> = observer(({ children }) => {
  const { formId } = useParam()
  const formStore = useStore('formStore')
  const [mounted, setMounted] = useState(false)

  async function fetchFormDetail() {
    const result = await FormService.detail(formId)
    formStore.setCurrent(result)
    // Set title
    document.title = `${result.name} - HeyForm`
    return result
  }

  useAsyncEffect(async () => {
    try {
      const form = formStore.current

      if (helper.isEmpty(form) || form?.id !== formId) {
        await fetchFormDetail()
      } else {
        fetchFormDetail()
      }

      setMounted(true)
    } catch (err: any) {
      console.error(err)
    }
  }, [formId])

  if (mounted) {
    return <>{children}</>
  } else {
    return null
  }
})

export const FormGuardLayout: FC<IComponentProps> = ({ children }) => {
  return (
    <WorkspaceGuard>
      <FormGuard>{children}</FormGuard>
    </WorkspaceGuard>
  )
}
