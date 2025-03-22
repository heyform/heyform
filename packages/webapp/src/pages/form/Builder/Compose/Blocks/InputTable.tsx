import { Button } from '@heyform-inc/form-renderer'
import type { Choice } from '@heyform-inc/shared-types-enums'
import { clone, nanoid } from '@heyform-inc/utils'
import { IconChevronRight, IconX } from '@tabler/icons-react'
import type { FC } from 'react'
import { startTransition, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStoreContext } from '../../store'
import { FakeSubmit } from '../FakeSubmit'
import type { BlockProps } from './Block'
import { Block } from './Block'

interface TheadProps extends Omit<ComponentProps, 'onChange'> {
  index: number
  column: Partial<Choice>
  deletable?: boolean
  onChange?: (columnId: string, value: any) => void
  onRemove?: (columnId: string) => void
}

const Thead: FC<TheadProps> = ({ index, column, deletable, onChange, onRemove, ...restProps }) => {
  const { t } = useTranslation()
  const [value, setValue] = useState(column.label)

  function handleChange(event: any) {
    const newValue = event.target.value

    setValue(newValue)
    startTransition(() => {
      onChange?.(column.id!, newValue)
    })
  }

  function handleRemove() {
    if (deletable) {
      onRemove?.(column.id!)
    }
  }

  return (
    <th>
      <div className="heyform-input-table-thead" {...restProps}>
        <div className="heyform-radio-remove" onClick={handleRemove}>
          <IconX />
        </div>
        <input
          type="text"
          value={value}
          placeholder={t('form.builder.compose.columnPlaceholder', { index: index + 1 })}
          onChange={handleChange}
        />
      </div>
    </th>
  )
}

export const InputTable: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { dispatch } = useStoreContext()
  const { t } = useTranslation()

  function handleAddColumn() {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            tableColumns: [
              ...(field.properties?.tableColumns || []),
              {
                id: nanoid(12),
                label: ''
              }
            ]
          }
        }
      }
    })
  }

  function handleLabelChange(columnId: string, label: any) {
    const properties = clone(field.properties)
    const tableColumns = properties?.tableColumns || []
    const index = tableColumns.findIndex(c => c.id === columnId)

    tableColumns[index].label = label

    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...properties,
            tableColumns
          }
        }
      }
    })
  }

  function handleRemoveColumn(columnId: string) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            tableColumns: field.properties?.tableColumns?.filter(c => c.id !== columnId)
          }
        }
      }
    })
  }

  const handleAddColumnCallback = useCallback(handleAddColumn, [field.properties])
  const handleLabelChangeCallback = useCallback(handleLabelChange, [field.properties])
  const handleRemoveColumnCallback = useCallback(handleRemoveColumn, [field.properties])

  return (
    <Block className="heyform-input-table" field={field} locale={locale} {...restProps}>
      <div className="mb-2 flex items-center justify-end">
        <Button.Link className="heyform-add-column" onClick={handleAddColumnCallback}>
          {t('form.builder.compose.addColumn')}
        </Button.Link>
      </div>
      <div className="heyform-table-scrollable">
        <table>
          <thead>
            <tr className="heyform-input-table-header">
              {field.properties?.tableColumns?.map((column, index) => (
                <Thead
                  key={column.id}
                  index={index}
                  column={column}
                  deletable={field.properties!.tableColumns!.length > 1}
                  onRemove={handleRemoveColumnCallback}
                  onChange={handleLabelChangeCallback}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="heyform-input-table-row">
                {field.properties?.tableColumns?.map(column => <td key={column.id}></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
