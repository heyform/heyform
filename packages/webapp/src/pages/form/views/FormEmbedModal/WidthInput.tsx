import { observer } from 'mobx-react-lite'
import { FC, useCallback, useEffect, useMemo } from 'react'

import { Input, Select } from '@/components'
import { useStore } from '@/store'

interface WidthInputProps {
  typeKey: string
  inputKey: string
}

const OPTIONS = [
  {
    label: 'px',
    value: 'px'
  },
  {
    label: '%',
    value: '%',
    max: 100
  }
]

export const WidthInput: FC<WidthInputProps> = observer(({ typeKey, inputKey }) => {
  const formStore = useStore('formStore')

  const widthType = useMemo(
    () => formStore.currentEmbedConfig[typeKey],
    [formStore.currentEmbedConfig, typeKey]
  )
  const width = useMemo(
    () => formStore.currentEmbedConfig[inputKey],
    [formStore.currentEmbedConfig, inputKey]
  )
  const maxWidth = useMemo(() => OPTIONS.find(row => row.value === widthType)?.max, [widthType])

  const handleTypeChange = useCallback(
    (newWidthType: any) => {
      let newWidth = width ?? 100

      if (newWidthType === '%' && width > 100) {
        newWidth = 100
      }

      formStore.updateEmbedConfig({
        [typeKey]: newWidthType,
        [inputKey]: newWidth
      })
    },
    [width]
  )

  function handleWidthChange(newWidth: any) {
    formStore.updateEmbedConfig({
      [inputKey]: newWidth
    })
  }

  return (
    <div className="form-embed-width-input">
      <Input value={width} type="number" min={1} max={maxWidth} onChange={handleWidthChange} />
      <Select options={OPTIONS} value={widthType} onChange={handleTypeChange} />
    </div>
  )
})
