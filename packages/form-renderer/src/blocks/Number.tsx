import type { FC } from 'react'

import { FormField, Input } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const Number: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  function getValues(values: any) {
    return values.input
  }

  return (
    <Block className="heyform-number" field={field} {...restProps}>
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
              required: field.validations?.required,
              type: 'number',
              message: t('This field is required')
            }
          ]}
        >
          <Input type="number" placeholder={t('Your answer goes here')} />
        </FormField>
      </Form>
    </Block>
  )
}
