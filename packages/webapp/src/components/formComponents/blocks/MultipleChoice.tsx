import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'

import { FormField, RadioGroup, SelectHelper } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'
import { useChoicesOption, useSelectionRange } from './hook'

export const MultipleChoice: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  const options = useChoicesOption(field.properties?.choices, field.properties?.randomize)
  const { min, max, allowMultiple } = useSelectionRange(
    field.properties?.allowMultiple,
    field.validations?.min,
    field.validations?.max
  )

  function getValues(values: any) {
    return helper.isValidArray(values?.value) ? values : undefined
  }

  return (
    <Block className="heyform-multiple-choice" field={field} {...restProps}>
      <SelectHelper min={min} max={max} />

      <Form
        initialValues={state.values[field.id]}
        autoSubmit={!allowMultiple}
        isSubmitShow={allowMultiple}
        field={field}
        getValues={getValues}
      >
        <FormField
          name="value"
          rules={[
            {
              required: field.validations?.required,
              type: 'array',
              min,
              max: max > 0 ? max : undefined,
              message: t('This field is required')
            }
          ]}
        >
          <RadioGroup
            options={options}
            allowMultiple={field.properties?.allowMultiple}
            max={field.validations?.max ?? 0}
          />
        </FormField>
      </Form>
    </Block>
  )
}
