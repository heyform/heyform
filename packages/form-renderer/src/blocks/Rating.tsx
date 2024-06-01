import type { FC } from 'react'

import { FormField, Rate } from '../components'
import { RATING_SHAPE_ICONS } from '../consts'
import { useStore } from '../store'
import { useTranslation } from '../utils'
import type { BlockProps } from './Block'
import { Block } from './Block'
import { Form } from './Form'

function getShape(shape?: string) {
  let name = 'star'

  if (shape && Object.keys(RATING_SHAPE_ICONS).includes(shape)) {
    name = shape
  }

  return name
}

export const Rating: FC<BlockProps> = ({ field, ...restProps }) => {
  const { state } = useStore()
  const { t } = useTranslation()
  const shape = getShape(field.properties?.shape)

  function getValues(values: any) {
    return values.input
  }

  function characterRender(index: number) {
    return (
      <>
        {RATING_SHAPE_ICONS[shape]}
        <span className="heyform-rate-index">{index}</span>
      </>
    )
  }

  return (
    <Block className="heyform-rating" field={field} {...restProps}>
      <Form
        initialValues={{
          input: state.values[field.id]
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
          <Rate count={field.properties?.total || 5} itemRender={characterRender} />
        </FormField>
      </Form>
    </Block>
  )
}
