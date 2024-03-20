import { IconCheck } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui'
import { SelectProps } from '@/components/ui/select/Native'
import { VARIABLE_KIND_CONFIGS } from '@/pages/form/Create/consts'

import { FieldIcon } from '../../FieldIcon'

export const KindSelect: FC<SelectProps> = props => {
  const { t } = useTranslation()

  function valueRender(option: any) {
    if (!option) {
      return null
    }

    return (
      <>
        <FieldIcon configs={VARIABLE_KIND_CONFIGS} kind={option.kind} />
        <span>{t(option.label)}</span>
      </>
    )
  }

  function optionRender(option: any) {
    return (
      <div className="select-option-container">
        <FieldIcon configs={VARIABLE_KIND_CONFIGS} kind={option.kind} />
        <span className="select-option-text">{t(option.label)}</span>
        {props.value === option.kind && (
          <span className="select-option-checkmark">
            <IconCheck />
          </span>
        )}
      </div>
    )
  }

  return (
    <Select
      className="right-sidebar-custom-select"
      popupClassName="right-sidebar-custom-select-popup"
      options={VARIABLE_KIND_CONFIGS as unknown as IOptionType[]}
      valueKey="kind"
      valueRender={valueRender as unknown as any}
      optionRender={optionRender}
      {...props}
    />
  )
}
