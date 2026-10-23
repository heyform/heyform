import { useRequest } from 'ahooks'
import { Field } from 'rc-field-form'
import { ReactNode, useEffect, useRef } from 'react'

import { isSettingVisible } from './utils'
import { IntegrationService } from '@/services'

import { Form, Input, Select, Switch } from '@/components'
import { AppSettingOptionType, AppSettingType } from '@/types'

function isBlank(value: unknown) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim())
}

interface LoadedOptionsSelectProps {
  formId: string
  appId: string
  setting: AppSettingType
  value?: string
  hasError?: boolean
  onChange?: (value?: string) => void
}

// A select whose options the app loads from its service, again whenever the
// account or a setting in `dependsOn` changes
export function LoadedOptionsSelect({
  formId,
  appId,
  setting,
  value,
  hasError,
  onChange
}: LoadedOptionsSelectProps) {
  const values: AnyMap | undefined = Form.useWatch(all => all, { preserve: true })
  const valuesRef = useRef(values)
  valuesRef.current = values

  const dependencies = values
    ? [values.connectionId, values.apiKey, ...(setting.dependsOn || []).map(name => values[name])]
    : undefined
  const isWaiting = (setting.dependsOn || []).some(name => isBlank(values?.[name]))

  const { data, loading, error } = useRequest(
    async (): Promise<AppSettingOptionType[] | undefined> => {
      if (isWaiting) {
        return undefined
      }

      const { apiKey, connectionId, ...config } = valuesRef.current || {}

      return IntegrationService.settingOptions(
        formId,
        appId,
        setting.name,
        config,
        apiKey || undefined,
        connectionId || undefined
      )
    },
    {
      ready: !!dependencies,
      refreshDeps: [JSON.stringify(dependencies ?? null)],
      // Typing a URL shouldn't load the options on every key
      debounceWait: 400
    }
  )

  // Only when new options arrive: drop a value they no longer offer, e.g. a
  // tab of the spreadsheet picked before
  useEffect(() => {
    if (data && !isBlank(value) && !data.some(option => option.value === value)) {
      onChange?.(undefined)
    }
  }, [data])

  return (
    <>
      <Select
        className="h-11 w-full sm:h-10"
        options={data || []}
        value={value}
        loading={loading}
        hasError={hasError}
        placeholder={setting.placeholder}
        onChange={onChange}
      />
      {error && !loading && (
        <div className="text-error mt-1 text-sm/6" data-slot="options-error">
          {error.message}
        </div>
      )}
    </>
  )
}

// Renders the setting only while its `visibleWhen` matches the form
export function VisibleSetting({
  setting,
  children
}: {
  setting: AppSettingType
  children: ReactNode
}) {
  if (!setting.visibleWhen) {
    return <>{children}</>
  }

  return (
    <Field shouldUpdate>
      {(_, __, form) =>
        isSettingVisible(setting, form.getFieldsValue(true)) ? <>{children}</> : null
      }
    </Field>
  )
}

export default function IntegrationSettingsItem({
  formId,
  appId,
  setting
}: {
  // Needed for a select that loads its options
  formId?: string
  appId?: string
  setting: AppSettingType
}) {
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
      if (setting.loadsOptions && formId && appId) {
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
            <LoadedOptionsSelect formId={formId} appId={appId} setting={setting} />
          </Form.Item>
        )
      }

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
