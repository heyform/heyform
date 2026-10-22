import { Form, Input, Select, Switch } from '@/components'
import { AppSettingType } from '@/types'

export default function IntegrationSettingsItem({ setting }: { setting: AppSettingType }) {
  switch (setting.type) {
    case 'text':
      return (
        <Form.Item
          name={setting.name}
          label={setting.label}
          footer={setting.description}
          rules={[
            {
              required: setting.required,
              whitespace: true
            }
          ]}
        >
          <Input placeholder={setting.placeholder} />
        </Form.Item>
      )

    case 'url':
      return (
        <Form.Item
          name={setting.name}
          label={setting.label}
          footer={setting.description}
          rules={[
            {
              type: 'url',
              required: setting.required
            }
          ]}
        >
          <Input placeholder={setting.placeholder} />
        </Form.Item>
      )

    case 'textarea':
      return (
        <Form.Item
          name={setting.name}
          label={setting.label}
          footer={setting.description}
          rules={[
            {
              required: setting.required,
              whitespace: true
            }
          ]}
        >
          <Input.TextArea rows={4} placeholder={setting.placeholder} />
        </Form.Item>
      )

    case 'select':
      return (
        <Form.Item
          name={setting.name}
          label={setting.label}
          footer={setting.description}
          rules={[
            {
              required: setting.required
            }
          ]}
        >
          <Select
            className="h-11 w-full sm:h-10"
            options={setting.options || []}
            placeholder={setting.placeholder}
          />
        </Form.Item>
      )

    case 'switch':
      return (
        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name={setting.name}
          label={setting.label}
          description={setting.description}
          isInline
        >
          <Switch />
        </Form.Item>
      )

    default:
      return null
  }
}
