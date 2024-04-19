import type { FC } from 'react'

import { FormField, RadioGroup } from '../components'
import { useStore } from '../store'
import { isNotNil, useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const YesNo: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  const options = [
    {
      keyName: 'Y',
      label: t('Yes'),
      value: field.properties?.choices?.find(c => c.label === 'Yes')?.id
    },
    {
      keyName: 'N',
      label: t('No'),
      value: field.properties?.choices?.find(c => c.label === 'No')?.id
    }
  ]

  function getValues(values: any) {
    return values.input ? values.input[0] : undefined
  }

  return (
    <Block className="heyform-yes-no" field={field} {...restProps}>
      <Form
        initialValues={{
          input: [state.values[field.id]].filter(isNotNil)
        }}
        autoSubmit={true}
        isSubmitShow={false}
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
          <RadioGroup className="w-40" options={options} />
        </FormField>
      </Form>
    </Block>
  )
}
