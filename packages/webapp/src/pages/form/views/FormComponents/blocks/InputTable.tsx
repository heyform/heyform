import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'

import { FormField, TableInput } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const InputTable: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  function getValues(values: any) {
    return helper.isValidArray(values.input) ? values.input : undefined
  }

  return (
    <Block className="heyform-date" field={field} {...restProps}>
      <Form
        initialValues={{
          input: state.values[field.id]
        }}
        field={field}
        getValues={getValues}
      >
        <FormField
          name="input"
          rules={[
            {
              type: 'array',
              required: field.validations?.required,
              message: t('This field is required')
            }
          ]}
        >
          <TableInput columns={field.properties?.tableColumns} />
        </FormField>
      </Form>
    </Block>
  )
}
