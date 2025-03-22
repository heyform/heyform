import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Select, useAlert } from '@/components'
import { ALL_FIELD_CONFIGS, STANDARD_FIELD_CONFIGS } from '@/consts'

import { useStoreContext } from '../../store'
import { getPropertiesFromKind } from '../../utils'

const DISABLED_KINDS = [FieldKindEnum.WELCOME, FieldKindEnum.THANK_YOU, FieldKindEnum.GROUP]
const DISABLED_CONFIG = ALL_FIELD_CONFIGS.filter(row => DISABLED_KINDS.includes(row.kind))

export default function TypeSwitcher() {
  const { t } = useTranslation()

  const alert = useAlert()
  const { state, dispatch } = useStoreContext()
  const field = state.currentField!

  const isDisabled = useMemo(() => DISABLED_KINDS.includes(field.kind), [field.kind])

  const options = useMemo(() => {
    const configs = isDisabled ? DISABLED_CONFIG : STANDARD_FIELD_CONFIGS

    return configs.map(row => ({
      value: row.kind,
      icon: <row.icon className="h-6 w-6 rounded p-0.5" />,
      label: t(row.label),
      disabled:
        row.kind === FieldKindEnum.PAYMENT &&
        state.fields.some(f => f.kind === FieldKindEnum.PAYMENT)
    }))
  }, [isDisabled, state.fields, t])

  const handleChange = useCallback(
    (kind: any) => {
      alert({
        title: t('form.builder.settings.questionType.headline'),
        description: t('form.builder.settings.questionType.subHeadline'),
        cancelProps: {
          label: t('components.cancel')
        },
        confirmProps: {
          label: t('components.change'),
          className: 'bg-error text-primary-light dark:text-primary hover:bg-error'
        },
        onConfirm: () => {
          dispatch({
            type: 'updateField',
            payload: {
              id: field.id,
              updates: {
                kind,
                properties: getPropertiesFromKind(field.properties!, kind)
              }
            }
          })
        }
      })
    },
    [alert, dispatch, field.id, field.properties, t]
  )

  return (
    <div className="mb-4 border-b border-accent-light pb-4">
      <Select
        className="w-full"
        contentProps={{
          position: 'popper'
        }}
        disabled={isDisabled}
        options={options}
        value={field.kind}
        onChange={handleChange}
      />
    </div>
  )
}
