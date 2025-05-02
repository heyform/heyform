import { getDateFormat, isDate } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useState } from 'react'

import { DateInput, FormField, TemporaryError } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const Date: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()
  const format = field.properties?.format || 'MM/DD/YYYY'
  const [error, setError] = useState<Error>()

  function getValues(values: any) {
    return values.input
  }

  function handleCountDownEnd() {
    setError(undefined)
  }

  return (
    <Block className="heyform-date" field={field} {...restProps}>
      <Form
        initialValues={{
          input: state.values[field.id]
        }}
        field={field}
        getValues={getValues}
        hideSubmitIfErrorOccurred={true}
        isSubmitShow={!error}
      >
        <FormField
          name="input"
          rules={[
            {
              required: field.validations?.required,
              message: t('This field is required')
            },
            {
              validator(rule, value) {
                return new Promise<void>((resolve, reject) => {
                  if (!rule.required && helper.isEmpty(value)) {
                    return resolve()
                  }

                  if (isDate(value, getDateFormat(format, field.properties?.allowTime))) {
                    resolve()
                  } else {
                    reject(rule.message)
                  }
                })
              },
              message: t("The date isn't valid")
            }
          ]}
        >
          <DateInput format={format} allowTime={field.properties?.allowTime} onError={setError} />
        </FormField>

        {error && <TemporaryError error={error} onCountDownEnd={handleCountDownEnd} />}
      </Form>
    </Block>
  )
}
