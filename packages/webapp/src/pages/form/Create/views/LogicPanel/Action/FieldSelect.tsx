import { htmlUtils } from '@heyform-inc/answer-utils'
import { IconCheck } from '@tabler/icons-react'
import { type FC, useMemo } from 'react'

import { Select } from '@/components/ui'
import { type FormField } from '@/models'
import { FieldKindIcon } from '@/pages/form/Create/views/LeftSidebar/FieldKindIcon'

interface FieldSelectProps {
  fields: FormField[]
  value?: string
  onChange?: (value: string) => void
}

export const FieldSelect: FC<FieldSelectProps> = ({ fields, value, onChange }) => {
  const options = useMemo(
    () =>
      fields.map(field => ({
        value: field.id,
        kind: field.kind,
        index: field.index,
        parentIndex: field.parent?.index,
        label: htmlUtils.plain(field.title as string)
      })),
    [fields]
  )

  function valueRender(option: any) {
    if (!option) {
      return null
    }

    return (
      <div className="flex w-full items-center">
        <FieldKindIcon kind={option.kind} index={option.index} parentIndex={option.parentIndex} />
        <span className="flex-1 truncate">{option.label}</span>
      </div>
    )
  }

  function optionRender(option: any) {
    return (
      <div className="select-option-container">
        <FieldKindIcon kind={option.kind} index={option.index} parentIndex={option.parentIndex} />
        <span className="select-option-text flex-1 truncate">{option.label}</span>
        {value === option.value && (
          <span className="select-option-checkmark">
            <IconCheck />
          </span>
        )}
      </div>
    )
  }

  return (
    <Select
      className="field-selector"
      popupClassName="field-selector-popup"
      placeholder="Select a question"
      options={options}
      value={value as any}
      valueRender={valueRender as unknown as any}
      optionRender={optionRender}
      onChange={onChange as any}
    />
  )
}
