import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
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

const RIGHT_TO_LEFT_MAP: AnyMap = {
  select: [
    FieldKindEnum.YES_NO,
    FieldKindEnum.LEGAL_TERMS,
    FieldKindEnum.MULTIPLE_CHOICE,
    FieldKindEnum.PICTURE_CHOICE
  ],
  multi_select: [FieldKindEnum.MULTIPLE_CHOICE, FieldKindEnum.PICTURE_CHOICE],
  number: [FieldKindEnum.NUMBER, FieldKindEnum.RATING, FieldKindEnum.OPINION_SCALE],
  date: [FieldKindEnum.DATE, FieldKindEnum.DATE_RANGE],
  email: [FieldKindEnum.EMAIL],
  phone_number: [FieldKindEnum.PHONE_NUMBER],
  url: [FieldKindEnum.URL],
  file: [FieldKindEnum.FILE_UPLOAD],
  title: [
    FieldKindEnum.MULTIPLE_CHOICE,
    FieldKindEnum.PICTURE_CHOICE,
    FieldKindEnum.SHORT_TEXT,
    FieldKindEnum.LONG_TEXT,
    FieldKindEnum.FULL_NAME,
    FieldKindEnum.ADDRESS,
    FieldKindEnum.COUNTRY,
    FieldKindEnum.PHONE_NUMBER,
    FieldKindEnum.EMAIL,
    FieldKindEnum.URL
  ],
  rich_text: [
    FieldKindEnum.MULTIPLE_CHOICE,
    FieldKindEnum.PICTURE_CHOICE,
    FieldKindEnum.SHORT_TEXT,
    FieldKindEnum.LONG_TEXT,
    FieldKindEnum.FULL_NAME,
    FieldKindEnum.ADDRESS,
    FieldKindEnum.COUNTRY,
    FieldKindEnum.PHONE_NUMBER,
    FieldKindEnum.EMAIL,
    FieldKindEnum.URL
  ]
}

const LEFT_TO_RIGHT_MAP: AnyMap = {
  [FieldKindEnum.YES_NO]: ['select'],
  [FieldKindEnum.LEGAL_TERMS]: ['select'],
  [FieldKindEnum.MULTIPLE_CHOICE]: ['select', 'multi_select', 'title', 'rich_text'],
  [FieldKindEnum.PICTURE_CHOICE]: ['select', 'multi_select', 'title', 'rich_text'],
  [FieldKindEnum.NUMBER]: ['number'],
  [FieldKindEnum.RATING]: ['number'],
  [FieldKindEnum.OPINION_SCALE]: ['number'],
  [FieldKindEnum.DATE]: ['date'],
  [FieldKindEnum.DATE_RANGE]: ['date'],
  [FieldKindEnum.EMAIL]: ['email', 'title', 'rich_text'],
  [FieldKindEnum.PHONE_NUMBER]: ['phone_number', 'title', 'rich_text'],
  [FieldKindEnum.URL]: ['url', 'title', 'rich_text'],
  [FieldKindEnum.FILE_UPLOAD]: ['file'],
  [FieldKindEnum.SHORT_TEXT]: ['title', 'rich_text'],
  [FieldKindEnum.LONG_TEXT]: ['title', 'rich_text'],
  [FieldKindEnum.FULL_NAME]: ['title', 'rich_text'],
  [FieldKindEnum.ADDRESS]: ['title', 'rich_text'],
  [FieldKindEnum.COUNTRY]: ['title', 'rich_text']
}

export default function NotionSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { formFields } = useFormStore()

  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [database, setDatabase] = useState<AnyMap>()

  async function fetchDatabases() {
    return IntegrationService.notionDatabases(formId, app?.id as string)
  }

  async function handleOAuth(code: string) {
    const result = await IntegrationService.notionOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  function handleValuesChange(changed: AnyMap) {
    if (changed.database) {
      setDatabase(changed.database)
    }
  }

  function handleFilter(value: any, leftOptions: any[], rightOptions: any[]) {
    const [left, right] = value || []

    let filteredLeftOptions = leftOptions
    let filteredRightOptions = rightOptions

    if (right) {
      const option = rightOptions.find(r => r.id === right)

      if (option) {
        filteredLeftOptions = leftOptions.filter(l =>
          RIGHT_TO_LEFT_MAP[option.type]?.includes(l.kind)
        )
      }
    }

    if (left) {
      const option = leftOptions.find(l => l.id === left)

      if (option) {
        filteredRightOptions = rightOptions.filter(r =>
          LEFT_TO_RIGHT_MAP[option.kind]?.includes(r.type)
        )
      }
    }

    return {
      leftOptions: filteredLeftOptions,
      rightOptions: filteredRightOptions
    }
  }

  useEffect(() => {
    const attributes = app?.integration?.attributes as AnyMap

    if (helper.isValid(attributes)) {
      if (attributes.database) {
        setDatabase(attributes.database.id)
      }
    }
  }, [])

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app} onValuesChange={handleValuesChange}>
      {/* Database */}
      <Form.Item
        name="database"
        label={t('form.integrations.notion.database.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[isAuthorized]}
          options={
            app.integration?.attributes?.database
              ? [app.integration.attributes.database]
              : undefined
          }
          fetch={fetchDatabases}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
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
        rightOptions={database?.fields}
        rightLabelKey="name"
        rightValueKey="id"
        rightPlaceholder={t('form.integrations.mapFields.rightPlaceholder', { name: app?.name })}
        filter={handleFilter}
      />
    </IntegrationSettingsForm>
  )
}
