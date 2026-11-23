import type { ChoiceMatrixValue, Column } from '@heyform-inc/shared-types-enums'
import { useId } from 'react'
import type { CSSProperties, FC } from 'react'

import { useTranslation } from '../utils'
import { fieldsToValidateRules, validate } from '@heyform-inc/answer-utils'

import { FormField } from '../components'
import { useStore } from '../store'
import { Block } from './Block'
import type { BlockProps } from './Block'
import { Form } from './Form'

interface MatrixInputProps {
  rows: Column[]
  columns: Column[]
  required?: boolean
  value?: ChoiceMatrixValue
  onChange?: (value: ChoiceMatrixValue) => void
}

function MatrixInput({ rows, columns, required, value, onChange }: MatrixInputProps) {
  const id = useId()
  const selections = Array.isArray(value) ? value : []

  return (
    <div
      className="heyform-choice-matrix"
      style={{ '--heyform-matrix-columns': columns.length } as CSSProperties}
    >
      <div className="heyform-matrix-header" aria-hidden="true">
        <span />
        {columns.map(column => (
          <span key={column.id}>{column.label}</span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="heyform-matrix-row"
          role="radiogroup"
          aria-labelledby={`${id}-${index}`}
          aria-required={required}
        >
          <span className="heyform-matrix-row-label" id={`${id}-${index}`}>
            {row.label}
          </span>
          {columns.map(column => (
            <label className="heyform-matrix-option" key={column.id}>
              <input
                type="radio"
                name={`${id}-${index}`}
                aria-label={column.label}
                checked={selections.some(
                  selection => selection.rowId === row.id && selection.columnId === column.id
                )}
                onChange={() =>
                  onChange?.([
                    ...selections.filter(selection => selection.rowId !== row.id),
                    { rowId: row.id, columnId: column.id }
                  ])
                }
              />
              <span aria-hidden="true">{column.label}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}

export const ChoiceMatrix: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()
  const [rule] = fieldsToValidateRules([field])
  const rows = field.properties?.matrixRows ?? []
  const columns = field.properties?.matrixColumns ?? []
  const storedValue = state.values[field.id]
  const selections = new Map<string, ChoiceMatrixValue[number]>()
  if (Array.isArray(storedValue)) {
    for (const selection of storedValue) {
      if (
        rows.some(row => row.id === selection?.rowId) &&
        columns.some(column => column.id === selection?.columnId)
      ) {
        selections.set(selection.rowId, { rowId: selection.rowId, columnId: selection.columnId })
      }
    }
  }

  return (
    <Block field={field} {...restProps}>
      <Form
        field={field}
        initialValues={{ input: Array.from(selections.values()) }}
        getValues={values => values.input}
      >
        <FormField
          name="input"
          rules={[
            {
              async validator(_, value) {
                try {
                  validate(rule, value)
                } catch (error) {
                  throw new Error(t((error as Error).message))
                }
              }
            }
          ]}
        >
          <MatrixInput rows={rows} columns={columns} required={rule.required} />
        </FormField>
      </Form>
    </Block>
  )
}
