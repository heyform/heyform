import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { IconCheck } from '@tabler/icons-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui'

import { useStoreContext } from '../../../store'
import { FIELD_CONFIGS, FIELD_THANK_YOU_CONFIG, FIELD_WELCOME_CONFIG } from '../../FieldConfig'
import { FieldIcon } from '../../FieldIcon'

export const TypeSelect: FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()
  const field = state.selectedField!

  const isPaymentDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.PAYMENT),
    [state.fields]
  )
  const options = useMemo(() => {
    return (FIELD_CONFIGS as unknown as IOptionType[]).map(config => {
      if (
        config.kind === FieldKindEnum.GROUP ||
        (config.kind === FieldKindEnum.PAYMENT && isPaymentDisabled)
      ) {
        config.disabled = true
      }
      return config
    })
  }, [isPaymentDisabled])

  function valueRender(option: any) {
    if (field.kind === FieldKindEnum.WELCOME) {
      option = FIELD_WELCOME_CONFIG
    } else if (field.kind === FieldKindEnum.THANK_YOU) {
      option = FIELD_THANK_YOU_CONFIG
    }

    if (!option) {
      return null
    }

    return (
      <>
        <FieldIcon kind={option.kind} />
        <span>{t(option.label)}</span>
      </>
    )
  }

  function optionRender(option: any) {
    if (option.kind === FieldKindEnum.WELCOME || option.kind === FieldKindEnum.THANK_YOU) {
      return null
    }

    return (
      <div className="select-option-container">
        <FieldIcon kind={option.kind} />
        <span className="select-option-text">{t(option.label)}</span>
        {field.kind === option.kind && (
          <span className="select-option-checkmark">
            <IconCheck />
          </span>
        )}
      </div>
    )
  }

  function handleChange(value: IValueType) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          kind: value as FieldKindEnum
        }
      }
    })
  }

  return (
    <div className="right-sidebar-group">
      <div className="right-sidebar-group-title">{t('formBuilder.type')}</div>
      <Select
        className="right-sidebar-custom-select"
        popupClassName="right-sidebar-custom-select-popup"
        options={options}
        value={field.kind}
        valueKey="kind"
        valueRender={valueRender as any}
        optionRender={optionRender as any}
        disabled={field.kind === FieldKindEnum.GROUP}
        onChange={handleChange}
      />
    </div>
  )
}
