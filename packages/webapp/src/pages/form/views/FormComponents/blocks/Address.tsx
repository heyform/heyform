import { helper } from '@heyform-inc/utils'
import { FC, useMemo, useState } from 'react'

import { CountrySelect, FormField, Input } from '../components'
import { useStore } from '../store'
import { initialValue, useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

function hasFilled(values: any) {
  return helper.isValid(values) && Object.values(values).some(helper.isValid)
}

export const Address: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state, dispatch } = useStore()
  const { t } = useTranslation()
  const [isDropdownShown, setIsDropdownShown] = useState(false)

  const isRequired = useMemo(() => {
    if (state.errorFieldId === field.id) {
      return hasFilled(state.values[field.id])
    }

    return field.validations?.required
  }, [field.id, field.validations?.required, state.errorFieldId, state.values])

  function getValues(values: any) {
    return hasFilled(values) ? values : undefined
  }

  function handleValuesChange(_: any, values: any) {
    if (!field.validations?.required && !hasFilled(values)) {
      dispatch({
        type: 'setValues',
        payload: {
          values: {
            [field.id]: undefined
          }
        }
      })
    }
  }

  return (
    <Block className="heyform-address" field={field} isScrollable={!isDropdownShown} {...restProps}>
      <Form
        initialValues={initialValue(state.values[field.id])}
        field={field}
        getValues={getValues}
        onValuesChange={handleValuesChange}
      >
        <div className="space-y-4">
          <FormField
            name="address1"
            rules={[
              {
                required: isRequired,
                message: t('This field is required')
              }
            ]}
          >
            <Input placeholder={t('Address Line 1')} />
          </FormField>

          <FormField name="address2">
            <Input placeholder={t('Address Line 2 (optional)')} />
          </FormField>

          <div className="flex w-full flex-col items-start justify-items-stretch space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <FormField
              className="w-full flex-1"
              name="city"
              rules={[
                {
                  required: isRequired,
                  message: t('This field is required')
                }
              ]}
            >
              <Input placeholder={t('City')} />
            </FormField>

            <FormField
              className="w-full flex-1"
              name="state"
              rules={[
                {
                  required: isRequired,
                  message: t('This field is required')
                }
              ]}
            >
              <Input placeholder={t('State/Province')} />
            </FormField>
          </div>

          <div className="flex w-full flex-col items-start justify-items-stretch space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <FormField
              className="w-full flex-1"
              name="zip"
              rules={[
                {
                  required: isRequired,
                  message: t('This field is required')
                }
              ]}
            >
              <Input placeholder={t('Zip/Postal Code')} />
            </FormField>

            <FormField
              className="w-full flex-1"
              name="country"
              rules={[
                {
                  required: isRequired,
                  message: t('This field is required')
                }
              ]}
            >
              <CountrySelect
                placeholder={t('Country')}
                onDropdownVisibleChange={setIsDropdownShown}
              />
            </FormField>
          </div>
        </div>
      </Form>
    </Block>
  )
}
