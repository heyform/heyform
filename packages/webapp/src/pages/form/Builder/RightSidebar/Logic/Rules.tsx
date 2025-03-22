import { htmlUtils } from '@heyform-inc/answer-utils'
import { Logic } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconArrowUpRight, IconChevronRight, IconDots } from '@tabler/icons-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button, Dropdown } from '@/components'
import { useAppStore } from '@/store'
import { FormFieldType } from '@/types'

import { QuestionIcon } from '../../LeftSidebar/QuestionList'
import { useStoreContext } from '../../store'

interface LogicItemProps {
  fields: FormFieldType[]
  logic: Logic
}

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

const LogicItem: FC<LogicItemProps> = ({ fields, logic }) => {
  const { t } = useTranslation()

  const { dispatch } = useStoreContext()
  const { openModal } = useAppStore()

  const field = useMemo(() => fields.find(f => f.id === logic.fieldId), [fields, logic.fieldId])
  const count = useMemo(() => logic.payloads.length, [logic])

  function handleMenuClick(name?: string) {
    switch (name) {
      case 'edit':
        openModal('LogicModal')
        dispatch({
          type: 'selectField',
          payload: {
            id: field!.id,
            parentId: field!.parent?.id
          }
        })
        break

      case 'delete':
        dispatch({
          type: 'deleteLogic',
          payload: {
            fieldId: field!.id
          }
        })
        break
    }
  }

  if (!field) {
    return null
  }

  return (
    <li className="flex items-center gap-x-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <QuestionIcon kind={field.kind} index={field.index} parentIndex={field.parent?.index} />
          <span className="text-sm/6 font-medium">{htmlUtils.plain(field.title as string)}</span>
        </div>
        <div className="text-xs/6 text-secondary">
          {t('form.builder.logic.rule.ruleCount', { count })}
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
          <IconDots className="h-5 w-5 text-secondary" />
        </Button.Link>
      </Dropdown>
    </li>
  )
}

export const Rules: FC = () => {
  const { t } = useTranslation()

  const { state } = useStoreContext()
  const { openModal } = useAppStore()

  return (
    <div className="space-y-1 pt-4">
      <div className="flex items-center justify-between text-sm/6">
        <span className="font-medium">{t('form.builder.logic.rule.headline')}</span>

        <Button.Link
          className="!pl-2 !pr-0.5 text-secondary hover:text-primary [&_[data-slot=button]]:gap-x-0"
          size="sm"
          onClick={() => openModal('LogicBulkEditModal')}
        >
          {t('form.builder.logic.rule.bulkEdit.headline')}
          <IconChevronRight className="h-5 w-5" />
        </Button.Link>
      </div>

      {helper.isValidArray(state.logics) ? (
        <ul className="space-y-4">
          {state.logics!.map(logic => (
            <LogicItem key={logic.fieldId} fields={state.fields} logic={logic} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary">
          <Trans
            t={t}
            i18nKey="form.builder.logic.rule.emptyState"
            components={{
              a: (
                <a
                  key="a"
                  className="underline underline-offset-4 hover:text-primary"
                  href="https://docs.heyform.net/features/conditional-logic"
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
