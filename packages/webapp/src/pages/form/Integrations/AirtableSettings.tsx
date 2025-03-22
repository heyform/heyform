import { helper } from '@heyform-inc/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import { MapFields } from './MapFields'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function AirtableSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { formFields } = useFormStore()

  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [base, setBase] = useState<string>()
  const [table, setTable] = useState<AnyMap>()

  async function fetchBases() {
    return IntegrationService.airtableBases(formId, app?.id as string)
  }

  async function fetchTables() {
    const result = await IntegrationService.airtableTables(formId, app?.id as string, base!)

    if (table) {
      const newTable = result.find((t: AnyMap) => t.id === table.id)

      setTable(newTable)
    }

    return result
  }

  async function handleOAuth(code: string) {
    const result = await IntegrationService.airtableOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  function handleValuesChange(changed: AnyMap) {
    if (changed.base) {
      setBase(changed.base.id)
    } else if (changed.table) {
      setTable(changed.table)
    }
  }

  useEffect(() => {
    const attributes = app?.integration?.attributes as AnyMap

    if (helper.isValid(attributes)) {
      if (attributes.base) {
        setBase(attributes.base.id)
      }

      if (attributes.table) {
        setTable(attributes.table)
      }
    }
  }, [])

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app} onValuesChange={handleValuesChange}>
      {/* Base */}
      <Form.Item
        name="base"
        label={t('form.integrations.airtable.base.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[isAuthorized]}
          options={
            app.integration?.attributes?.base ? [app.integration.attributes.base] : undefined
          }
          fetch={fetchBases}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Table */}
      <Form.Item
        name="table"
        label={t('form.integrations.airtable.table.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[base]}
          options={
            app.integration?.attributes?.table ? [app.integration.attributes.table] : undefined
          }
          fetch={fetchTables}
          labelKey="name"
          valueKey="id"
          disabled={helper.isNil(base)}
        />
      </Form.Item>

      {/* Map questions */}
      <MapFields
        name="fields"
        label={t('form.integrations.mapFields.headline')}
        description={t('form.integrations.mapFields.subHeadline', { name: app?.name })}
        leftOptions={formFields}
        leftLabelKey="title"
        leftValueKey="id"
        leftPlaceholder={t('form.integrations.mapFields.leftPlaceholder')}
        rightOptions={table?.fields}
        rightLabelKey="name"
        rightValueKey="id"
        rightPlaceholder={t('form.integrations.mapFields.rightPlaceholder', { name: app?.name })}
      />
    </IntegrationSettingsForm>
  )
}
