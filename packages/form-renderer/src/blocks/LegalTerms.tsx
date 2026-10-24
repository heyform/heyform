import type { FC } from 'react'

import { useTranslation } from '../utils'

import { FormField, RadioGroup } from '../components'
import { useStore } from '../store'
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
              // A required block must be accepted; the server rejects anything else.
              validator: (_, value) =>
                field.validations?.required && value?.[0] !== true
                  ? Promise.reject(t('This field is required'))
                  : Promise.resolve()
            }
          ]}
        >
          <RadioGroup className="w-56" options={options} />
        </FormField>
      </Form>
    </Block>
  )
}
