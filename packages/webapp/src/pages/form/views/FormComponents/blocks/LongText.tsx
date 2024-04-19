import type { FC } from 'react'

import { FormField, Textarea } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const LongText: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  function getValues(values: any) {
    return values.input
  }

  return (
    <Block className="heyform-long-text" field={field} {...restProps}>
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
              message: t('This field is required')
            }
          ]}
        >
          <Textarea placeholder={t('Your answer goes here')} />
        </FormField>
      </Form>
    </Block>
  )
}
