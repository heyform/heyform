import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'

import { FormField, Input } from '../components'
import { useStore } from '../store'
import { initialValue, useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const FullName: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  function getValues(values: any) {
    return helper.isValid(values?.firstName) || helper.isValid(values?.lastName)
      ? values
      : undefined
  }

  return (
    <Block className="heyform-full-name" field={field} {...restProps}>
      <Form
        initialValues={initialValue(state.values[field.id])}
        field={field}
        getValues={getValues}
      >
        <div className="flex items-start justify-items-stretch w-full space-x-4">
          <FormField
            className="flex-1"
            name="firstName"
            rules={[
              {
                required: field.validations?.required,
                message: t('This field is required')
              }
            ]}
          >
            <Input placeholder={t('First Name')} />
          </FormField>

          <FormField
            className="flex-1"
            name="lastName"
            rules={[
              {
                required: field.validations?.required,
                message: t('This field is required')
              }
            ]}
          >
            <Input placeholder={t('Last Name')} />
          </FormField>
        </div>
      </Form>
    </Block>
  )
}
