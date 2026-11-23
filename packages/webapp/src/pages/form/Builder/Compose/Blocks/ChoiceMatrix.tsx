import type { Column } from '@heyform-inc/shared-types-enums'
import { IconChevronRight, IconX } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { nanoid } from '@heyform-inc/utils'

import { useStoreContext } from '../../store'
import { FakeSubmit } from '../FakeSubmit'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const ChoiceMatrix: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { dispatch } = useStoreContext()
  const { t } = useTranslation()
  const rows = field.properties?.matrixRows ?? []
  const columns = field.properties?.matrixColumns ?? []

  function update(axis: 'matrixRows' | 'matrixColumns', labels: Column[]) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: { properties: { ...field.properties, [axis]: labels } }
      }
    })
  }

  function renderLabel(axis: 'matrixRows' | 'matrixColumns', item: Column, index: number) {
    const labels = axis === 'matrixRows' ? rows : columns
    const description = String(
      t(
        axis === 'matrixRows'
          ? 'form.builder.compose.rowPlaceholder'
          : 'form.builder.compose.columnPlaceholder',
        { index: index + 1 }
      )
    )

    return (
      <div className="flex items-center gap-1 p-2">
        <input
          type="text"
          className="border-current/20 w-32 rounded border bg-transparent px-2 py-1"
          value={item.label}
          aria-label={description}
          placeholder={description}
          onChange={event => {
            const label = event.target.value
            update(
              axis,
              labels.map(current => (current.id === item.id ? { ...current, label } : current))
            )
          }}
        />
        <button
          type="button"
          className="rounded p-1 disabled:opacity-30"
          aria-label={String(t('form.builder.compose.removeMatrixLabel', { label: description }))}
          disabled={labels.length <= (axis === 'matrixRows' ? 1 : 2)}
          onClick={() =>
            update(
              axis,
              labels.filter(current => current.id !== item.id)
            )
          }
        >
          <IconX size={16} aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <Block field={field} locale={locale} {...restProps}>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="underline"
          onClick={() =>
            update('matrixColumns', [
              ...columns,
              {
                id: nanoid(12),
                label: String(
                  t('form.builder.compose.columnPlaceholder', { index: columns.length + 1 })
                )
              }
            ])
          }
        >
          {String(t('form.builder.compose.addColumn'))}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td />
              {columns.map((column, index) => (
                <th key={column.id} scope="col">
                  {renderLabel('matrixColumns', column, index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-current/20 border-t">
                <th scope="row">{renderLabel('matrixRows', row, index)}</th>
                {columns.map(column => (
                  <td key={column.id} className="text-center">
                    <span
                      className="inline-block size-4 rounded-full border border-current"
                      aria-hidden="true"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="mt-2 underline"
        onClick={() =>
          update('matrixRows', [
            ...rows,
            {
              id: nanoid(12),
              label: String(t('form.builder.compose.rowPlaceholder', { index: rows.length + 1 }))
            }
          ])
        }
      >
        {String(t('form.builder.compose.addRow'))}
      </button>
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
