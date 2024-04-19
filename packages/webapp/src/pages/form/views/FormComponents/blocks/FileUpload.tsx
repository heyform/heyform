import type { FC } from 'react'

import { FileUploader, FormField } from '../components'
import { useStore } from '../store'
import { isFile, useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

export const FileUpload: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()

  function getValues(values: any) {
    return isFile(values.input) ? values.input : undefined
  }

  return (
    <Block className="heyform-file-upload" field={field} {...restProps}>
      <Form
        initialValues={{
          input: state.values[field.id]
        }}
        autoSubmit={true}
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
          <FileUploader />
        </FormField>
      </Form>
    </Block>
  )
}
