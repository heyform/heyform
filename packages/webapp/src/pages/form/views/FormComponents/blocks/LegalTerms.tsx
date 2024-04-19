import type { FC } from 'react'

import { FormField, RadioGroup } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const LegalTerms: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  const options = [
    {
      keyName: 'Y',
      label: t('I accept'),
      value: true
    },
    {
      keyName: 'N',
      label: t("I don't accept"),
      value: false
    }
  ]

  function getValues(values: any) {
    return values.input ? values.input[0] : undefined
  }

  return (
    <Block className="heyform-legal-terms" field={field} {...restProps}>
      <Form
        initialValues={{
          input: [state.values[field.id]]
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
          <RadioGroup className="w-56" options={options} />
        </FormField>
      </Form>
    </Block>
  )
}
