import { isDate } from '@heyform-inc/answer-utils'
import { date, helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useState } from 'react'

import { DateRangeInput, FormField, TemporaryError } from '../components'
import { TIME_FORMAT } from '../consts'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const DateRange: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()
  const format = field.properties?.format || 'MM/DD/YYYY'
  const dateTimeFormat = field.properties?.allowTime ? `${format} ${TIME_FORMAT}` : format
  const [error, setError] = useState<Error>()

  function getValues(values: any) {
    return helper.isValid(values.input?.start) || helper.isValid(values.input?.end)
      ? values.input
      : undefined
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

                  if (!isDate(value.start, dateTimeFormat)) {
                    return reject(t('Start date is not valid'))
                  }

                  if (!isDate(value.end, dateTimeFormat)) {
                    return reject(t('End date is not valid'))
                  }

                  const start = date(value.start, dateTimeFormat)
                  const end = date(value.end, dateTimeFormat)

                  if (end.isBefore(start)) {
                    return reject(t('End date must be after start date'))
                  }

                  resolve()
                })
              }
            }
          ]}
        >
          <DateRangeInput
            format={format}
            allowTime={field.properties?.allowTime}
            onError={setError}
          />
        </FormField>

        {error && <TemporaryError error={error} onCountDownEnd={handleCountDownEnd} />}
      </Form>
    </Block>
  )
}
