import type { FC } from 'react'

import { FormField, RadioGroup } from '../components'
import { useStore } from '../store'
import { isNotNil, useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const OpinionScale: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  const options = Array.from({ length: field.properties?.total || 10 }).map((_, index) => {
    const value = index + 1

    return {
      keyName: value === 10 ? '0' : `${value}`,
      label: `${value}`,
      value: value
    }
  })

  function getValues(values: any) {
    return values.input[0]
  }

  return (
    <Block className="heyform-opinion-scale" field={field} {...restProps}>
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
          <RadioGroup options={options} isHotkeyShow={false} />
        </FormField>

        <div className="heyform-opinion-scale-labels">
          <div className="flex-1 text-left">{field.properties?.leftLabel}</div>
          <div className="flex-1 text-center">{field.properties?.centerLabel}</div>
          <div className="flex-1 text-right">{field.properties?.rightLabel}</div>
        </div>
      </Form>
    </Block>
  )
}
