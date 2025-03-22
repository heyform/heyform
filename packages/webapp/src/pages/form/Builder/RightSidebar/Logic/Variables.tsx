import { FieldKindEnum, Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconArrowUpRight, IconDots, IconPlus } from '@tabler/icons-react'
import { FC, startTransition } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button, Dropdown, Tooltip } from '@/components'
import { VARIABLE_KIND_CONFIGS } from '@/consts'
import { QuestionIcon } from '@/pages/form/Builder/LeftSidebar/QuestionList'
import { useAppStore } from '@/store'

import { useStoreContext } from '../../store'

const ACTIONS = [
  {
    label: 'components.edit',
    value: 'edit'
  },
  {
    label: 'components.delete',
    value: 'delete'
  }
]

const VariableItem: FC<{ variable: Variable }> = ({ variable }) => {
  const { t } = useTranslation()

  const { dispatch } = useStoreContext()
  const { openModal } = useAppStore()

  function handleMenuClick(name?: string) {
    switch (name) {
      case 'edit':
        openModal('VariableModal')
        dispatch({
          type: 'selectVariable',
          payload: {
            variableId: variable.id
          }
        })
        break

      case 'delete':
        dispatch({
          type: 'deleteVariable',
          payload: {
            id: variable.id
          }
        })
        break
    }
  }

  return (
    <li className="flex items-center gap-x-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <QuestionIcon
            className="w-6 justify-center px-0"
            configs={VARIABLE_KIND_CONFIGS}
            kind={variable.kind as FieldKindEnum}
          />
          <span className="text-sm/6 font-medium">{variable.name}</span>
        </div>
        <div className="text-xs/6 text-secondary">
          {t('form.builder.logic.variable.defaultValue')}: {variable.value}
        </div>
      </div>

      <Dropdown
        contentProps={{
          className: 'min-w-36 [&_[data-value=delete]]:text-error',
          side: 'bottom',
          sideOffset: 8,
          align: 'end'
        }}
        options={ACTIONS}
        multiLanguage
        onClick={handleMenuClick}
      >
        <Button.Link size="sm" iconOnly>
          <Tooltip label={t('form.builder.logic.hiddenFields.menuTip')}>
            <IconDots className="h-5 w-5 text-secondary" />
          </Tooltip>
        </Button.Link>
      </Dropdown>
    </li>
  )
}

export const Variables: FC = () => {
  const { t } = useTranslation()

  const { state, dispatch } = useStoreContext()
  const { openModal } = useAppStore()

  function handleClick() {
    dispatch({
      type: 'selectVariable',
      payload: {
        variableId: ''
      }
    })
    startTransition(() => {
      openModal('VariableModal')
    })
  }

  return (
    <div className="space-y-1 pt-4">
      <div className="flex items-center justify-between text-sm/6">
        <span className="font-medium">{t('form.builder.logic.variable.headline')}</span>

        <Tooltip label={t('form.builder.logic.variable.addVariable')}>
          <Button.Link
            className="text-secondary hover:text-primary [&_[data-slot=button]]:gap-x-0"
            size="sm"
            iconOnly
            onClick={handleClick}
          >
            <IconPlus className="h-5 w-5" />
          </Button.Link>
        </Tooltip>
      </div>

      {helper.isValidArray(state.variables) ? (
        <ul className="space-y-1.5">
          {state.variables!.map(variable => (
            <VariableItem key={variable.id} variable={variable} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary">
          <Trans
            t={t}
            i18nKey="form.builder.logic.variable.emptyState"
            components={{
              a: (
                <a
                  key="a"
                  className="underline underline-offset-4 hover:text-primary"
                  href="https://docs.heyform.net/features/variable"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              icon: <IconArrowUpRight key="icon" className="inline h-4 w-4" stroke={1.5} />
            }}
          />
        </p>
      )}
    </div>
  )
}
