import Form from 'rc-field-form'
import type { FC } from 'react'

import type { CustomFormProps } from './CustomForm'
import CustomForm from './CustomForm'
import type { FormItemProps } from './FormItem'
import FormItem from './FormItem'
import type { SwitchItemProps } from './SwitchItem'
import SwitchItem from './SwitchItem'

export { useForm } from 'rc-field-form'

type ExportFormType = typeof Form & {
  Item: FC<FormItemProps>
  Switch: FC<SwitchItemProps>
  Custom: FC<CustomFormProps>
}

const ExportForm = Form as ExportFormType

ExportForm.Item = FormItem
ExportForm.Switch = SwitchItem
ExportForm.Custom = CustomForm

export default ExportForm
