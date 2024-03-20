import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useMemo } from 'react'

import { useStoreContext } from '@/pages/form/Create/store'

import { CoverImage } from './CoverImage'
import { Layout } from './Layout'
import { Settings } from './Settings'
import { TypeSelect } from './TypeSelect'

export const Question: FC = () => {
  const { state } = useStoreContext()
  const field = state.selectedField

  const memoTypeSelect = useMemo(() => <TypeSelect />, [field?.id, state.parentId, field?.kind])
  const memoSettings = useMemo(
    () => <Settings />,
    [field?.id, state.parentId, field?.properties, field?.validations]
  )
  const memoCoverImage = useMemo(
    () => <CoverImage />,
    [field?.id, state.parentId, field?.layout?.mediaUrl]
  )
  const memoLayout = useMemo(
    () => <Layout />,
    [field?.id, state.parentId, field?.layout?.align, field?.layout?.brightness]
  )

  if (helper.isEmpty(field?.id)) {
    return null
  }

  return (
    <div>
      {memoTypeSelect}
      {memoSettings}
      {memoCoverImage}
      {memoLayout}
    </div>
  )
}
