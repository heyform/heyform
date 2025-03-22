import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal, useOnboardingStorage } from '@/components'
import {
  ADD_QUESTION2_STORAGE_NAME,
  ALL_FIELD_CONFIGS,
  BLOCK_GROUPS,
  FIELD_WELCOME_CONFIG
} from '@/consts'
import { useAppStore, useModal } from '@/store'

import { useStoreContext } from '../store'
import { getFieldFromKind } from '../utils'
import { QuestionIcon } from './QuestionList'

interface QuestionTypeItemProps {
  config: typeof FIELD_WELCOME_CONFIG
  isWelcomeDisabled?: boolean
  isPaymentDisabled?: boolean
}

const QuestionTypeItem: FC<QuestionTypeItemProps> = ({
  config,
  isWelcomeDisabled,
  isPaymentDisabled
}) => {
  const { t } = useTranslation()

  const { closeModal } = useAppStore()
  const { dispatch } = useStoreContext()
  const { setItem } = useOnboardingStorage()

  const isDisabled =
    (config.kind === FieldKindEnum.WELCOME && isWelcomeDisabled) ||
    (config.kind === FieldKindEnum.PAYMENT && isPaymentDisabled)

  function handleClick() {
    if (isDisabled) {
      return
    }

    setItem(ADD_QUESTION2_STORAGE_NAME, true)

    closeModal('QuestionTypesModal')
    dispatch({
      type: 'addField',
      payload: {
        field: getFieldFromKind(config.kind)
      }
    })
  }

  return (
    <li>
      <button
        type="button"
        className="group flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-sm/6 font-medium text-primary hover:bg-accent-light aria-disabled:pointer-events-none aria-disabled:opacity-60"
        aria-disabled={isDisabled}
        onClick={handleClick}
      >
        <QuestionIcon
          className="h-6 w-6 justify-center border-none bg-transparent p-0 [&_[data-slot=icon]]:ml-0 [&_[data-slot=icon]]:h-5 [&_[data-slot=icon]]:w-5"
          kind={config.kind}
        />
        {t(config.label)}
      </button>
    </li>
  )
}

const QuestionTypesComponent = () => {
  const { t } = useTranslation()
  const { state } = useStoreContext()

  const isWelcomeDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.WELCOME),
    [state.fields]
  )
  const isPaymentDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.PAYMENT),
    [state.fields]
  )

  const groups = BLOCK_GROUPS.map(row =>
    row.map(group => ({
      name: group.name,
      list: ALL_FIELD_CONFIGS.filter(config => group.list.includes(config.kind))
    }))
  )

  return (
    <div>
      <h2 className="text-balance text-xl/6 font-semibold text-primary sm:text-lg/6">
        {t('form.builder.sidebar.addQuestion')}
      </h2>

      <div className="-mx-2 mt-6 grid grid-cols-1 gap-8 sm:grid-cols-4">
        {groups.map((row, index) => (
          <div key={index} className="space-y-8">
            {row.map(group => (
              <div key={group.name}>
                <div className="pl-2 text-sm/6 font-medium text-secondary">{t(group.name)}</div>
                <ul className="mt-1 space-y-1" key={group.name}>
                  {group.list.map(config => (
                    <QuestionTypeItem
                      key={config.kind}
                      config={config}
                      isWelcomeDisabled={isWelcomeDisabled}
                      isPaymentDisabled={isPaymentDisabled}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function QuestionTypesModal() {
  const { isOpen, onOpenChange } = useModal('QuestionTypesModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-4xl'
      }}
      onOpenChange={onOpenChange}
    >
      <QuestionTypesComponent />
    </Modal>
  )
}
