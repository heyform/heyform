import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'

import { ChoiceRadioGroup, FormField, SelectHelper } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'
import { useChoicesOption, useSelectionRange } from './hook'

export const PictureChoice: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  const options = useChoicesOption(
    field.properties?.choices,
    field.properties?.randomize,
    state.translations?.[state.locale]?.[field.id]?.choices
  )
  const { min, max, allowMultiple } = useSelectionRange(
    field.properties?.allowMultiple,
    field.validations?.min,
    field.validations?.max
  )

  function getValues({ value }: any) {
    return helper.isValidArray(value?.value) || helper.isValid(value?.other) ? value : undefined
  }

  return (
    <Block className="heyform-picture-choice" field={field} {...restProps}>
      <SelectHelper min={min} max={max} />

      <Form
        initialValues={{
          value: state.values[field.id]
        }}
        autoSubmit={!allowMultiple}
        isSubmitShow={allowMultiple}
        field={field}
        getValues={getValues}
      >
        <FormField
          name="value"
          rules={[
            {
              validator: (_, value) => {
                if (field.validations?.required) {
                  if (helper.isEmpty(value)) {
                    return Promise.reject(t('This field is required'))
                  }
                } else if (helper.isNil(value)) {
                  return Promise.resolve()
                }

                const count = value.value.length + helper.isValid(value.other) ? 1 : 0

                if (count < min) {
                  return Promise.reject(
                    t('Choose at least {{min}} choices', { min: field.validations?.min })
                  )
                }

                if (max > 0 && count > max) {
                  return Promise.reject(
                    t('Choose up to {{max}} choices', { max: field.validations?.max })
                  )
                }

                return Promise.resolve()
              }
            }
          ]}
        >
          <ChoiceRadioGroup
            options={options}
            allowMultiple={field.properties?.allowMultiple}
            allowOther={field.properties?.allowOther}
            max={field.validations?.max}
            enableImage={true}
          />
        </FormField>
      </Form>
    </Block>
  )
}
