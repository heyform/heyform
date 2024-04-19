import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import { isValidPhoneNumber } from 'libphonenumber-js'
import type { FC } from 'react'
import { useState } from 'react'

import { FormField, PhoneNumberInput } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const PhoneNumber: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()
  const [isDropdownShown, setIsDropdownShown] = useState(false)

  function getValues(values: any) {
    return values.input
  }

  return (
    <Block
      className={clsx('heyform-phone-number', {
        'heyform-dropdown-visible': isDropdownShown
      })}
      field={field}
      isScrollable={!isDropdownShown}
      {...restProps}
    >
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
              validator(rule, value) {
                return new Promise<void>((resolve, reject) => {
                  if (!rule.required && helper.isEmpty(value)) {
                    return resolve()
                  }

                  if (isValidPhoneNumber(value)) {
                    resolve()
                  } else {
                    reject(rule.message)
                  }
                })
              },
              message: t('This field is required')
            }
          ]}
        >
          <PhoneNumberInput
            defaultCountryCode={field.properties?.defaultCountryCode}
            onDropdownVisibleChange={setIsDropdownShown}
          />
        </FormField>
      </Form>
    </Block>
  )
}
