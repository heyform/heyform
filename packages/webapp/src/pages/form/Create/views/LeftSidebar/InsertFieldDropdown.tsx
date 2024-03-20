import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconPlus } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC } from 'react'
import { startTransition, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dropdown, Input, Tooltip } from '@/components/ui'

import { useStoreContext } from '../../store'
import { getFieldFromKind } from '../../utils'
import type { FieldConfig, FieldGroup } from '../FieldConfig'
import { BLOCK_GROUPS, FIELD_CONFIGS } from '../FieldConfig'
import { FieldIcon } from '../FieldIcon'

interface InsertFieldMenuProps extends Omit<IComponentProps, 'onClick'> {
  onClick: (kind: FieldKindEnum) => void
}

interface InsertFieldItemProps {
  config: FieldConfig
  isWelcomeDisabled?: boolean
  isThankYouDisabled?: boolean
  isPaymentDisabled?: boolean
  onClick: (kind: FieldKindEnum) => void
}

const InsertFieldItem: FC<InsertFieldItemProps> = ({
  config,
  isWelcomeDisabled,
  isThankYouDisabled,
  isPaymentDisabled,
  onClick
}) => {
  const { t } = useTranslation()
  const isDisabled =
    (config.kind === FieldKindEnum.WELCOME && isWelcomeDisabled) ||
    (config.kind === FieldKindEnum.THANK_YOU && isThankYouDisabled) ||
    (config.kind === FieldKindEnum.PAYMENT && isPaymentDisabled)

  function handleClick() {
    if (!isDisabled) {
      onClick(config.kind)
    }
  }

  return (
    <div
      className={clsx(
        'insert-field-item group flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium',
        {
          'insert-field-item-disabled': isDisabled
        }
      )}
      onClick={handleClick}
    >
      <FieldIcon className="insert-field-item-icon mr-3 flex-shrink-0" kind={config.kind} />
      {t(config.label)}
    </div>
  )
}

function filterGroups(keyword?: string): FieldGroup[] {
  let configs: FieldConfig[] = FIELD_CONFIGS

  if (helper.isValid(keyword)) {
    configs = FIELD_CONFIGS.filter(config =>
      config.label.toLowerCase().includes(keyword!.toLowerCase())
    )
  }

  return BLOCK_GROUPS.map(group => ({
    ...group,
    configs: configs.filter(config => group.list.includes(config.kind))
  })).filter(group => group.configs.length > 0)
}

const InsertFieldMenu: FC<InsertFieldMenuProps> = ({ onClick }) => {
  const { t } = useTranslation()
  const { state } = useStoreContext()
  const isWelcomeDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.WELCOME),
    [state.fields]
  )
  const isThankYouDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.THANK_YOU),
    [state.fields]
  )
  const isPaymentDisabled = useMemo(
    () => state.fields.some(f => f.kind === FieldKindEnum.PAYMENT),
    [state.fields]
  )

  const [groups, setGroups] = useState<FieldGroup[]>(filterGroups())

  function handleKeywordChange(value?: any) {
    startTransition(() => {
      const result = filterGroups(value as string)
      setGroups(result)
    })
  }

  useLayoutEffect(() => {
    const container = document.querySelector('.insert-field-groups')
    const elements: HTMLDivElement[] = Array.from(
      container!.querySelectorAll('.insert-field-group')
    )
    const columns = Array.from({ length: 4 }).fill(0) as number[]
    const gap = 36

    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      const min = Math.min(...columns)
      const idx = columns.indexOf(min)

      columns[idx] = columns[idx] + rect.height + gap
      element.style.top = `${min}px`
      element.style.left = `${25 * idx}%`
    }
  }, [groups])

  const handleKeywordChangeCallback = useCallback(handleKeywordChange, [])

  return (
    <div className="insert-field-menu flex flex-col rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <Input.Search
        className="insert-field-search rounded-none border-l-0 border-r-0 border-t-0 border-gray-200 px-4 outline-none focus:outline-none"
        placeholder={t('formBuilder.searchFieldType')}
        onChange={handleKeywordChangeCallback}
      />
      <div className="px-4 py-5">{t('formBuilder.allFieldTypes')}</div>
      <div className="insert-field-groups scrollbar relative">
        {groups.map(group => (
          <div key={group.name} className="insert-field-group absolute w-1/4">
            <div className="insert-field-group-title mb-1 pl-4 text-sm font-medium text-slate-500">
              {t(group.name)}
            </div>
            <div className="insert-field-list" key={group.name}>
              {FIELD_CONFIGS.filter(config => group.list.includes(config.kind)).map(config => (
                <InsertFieldItem
                  key={config.kind}
                  config={config}
                  isWelcomeDisabled={isWelcomeDisabled}
                  isThankYouDisabled={isThankYouDisabled}
                  isPaymentDisabled={isPaymentDisabled}
                  onClick={onClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const InsertFieldDropdown = () => {
  const { dispatch } = useStoreContext()
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  function handleCreateField(kind: FieldKindEnum) {
    setVisible(false)
    dispatch({
      type: 'addField',
      payload: {
        field: getFieldFromKind(kind)
      }
    })
  }

  const dropdownTrigger = useMemo(
    () => (
      <Tooltip ariaLabel={t('formBuilder.addNewQuestion')}>
        <Button.Link className="h-6 w-6" leading={<IconPlus />} />
      </Tooltip>
    ),
    []
  )
  const dropdownOverlay = useMemo(
    () => (visible ? <InsertFieldMenu onClick={handleCreateField} /> : <></>),
    [visible]
  )

  return (
    <Dropdown
      className="insert-field-dropdown h-6 w-6 cursor-pointer rounded-md text-slate-500 hover:bg-slate-50"
      popupClassName="insert-field-popup"
      visible={visible}
      placement="right-start"
      dismissOnClickInside={false}
      overlay={dropdownOverlay}
      onDropdownVisibleChange={setVisible}
    >
      {dropdownTrigger}
    </Dropdown>
  )
}
