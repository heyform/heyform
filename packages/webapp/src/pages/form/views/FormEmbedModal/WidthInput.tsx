import { observer } from 'mobx-react-lite'
import { FC, useCallback, useMemo } from 'react'

import { Input, Select } from '@/components'
import { useFormStore } from '@/store'

interface WidthInputProps {
  typeKey: 'fullpage' | 'standard' | 'modal' | 'popup'
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
  const formStore = useFormStore()

  const widthType = useMemo(
    () =>
      formStore.embedConfigs[typeKey]?.[
        inputKey as keyof (typeof formStore.embedConfigs)[typeof typeKey]
      ],
    [formStore, inputKey, typeKey]
  )
  const width =
    useMemo(
      () =>
        formStore.embedConfigs[typeKey]?.[
          inputKey as keyof (typeof formStore.embedConfigs)[typeof typeKey]
        ],
      [formStore, inputKey, typeKey]
    ) || 100
  const maxWidth = useMemo(() => OPTIONS.find(row => row.value === widthType)?.max, [widthType])

  const handleTypeChange = useCallback(
    (newWidthType: any) => {
      let newWidth = (width as any) ?? 100

      if (newWidthType === '%' && width > 100) {
        newWidth = 100
      }

      formStore.updateEmbedConfig({
        [typeKey]: newWidthType,
        [inputKey]: newWidth
      })
    },
    [width, formStore, inputKey, typeKey]
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
