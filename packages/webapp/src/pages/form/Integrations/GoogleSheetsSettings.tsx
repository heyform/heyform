import { helper } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import { MapFields } from './MapFields'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function GoogleSheetsSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { formFields } = useFormStore()

  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [drive, setDrive] = useState<string>()
  const [spreadsheet, setSpreadsheet] = useState<string>()
  const [worksheet, setWorksheet] = useState<string>()

  const { data: sheetFields, loading } = useRequest(
    async () => {
      if (helper.isEmpty(spreadsheet) || helper.isEmpty(worksheet)) {
        return
      }

      const result = await IntegrationService.googleSheetsFields(
        formId,
        app?.id as string,
        spreadsheet!,
        worksheet!
      )

      return result.map((row: string, index: number) => ({
        id: index,
        name: row
      }))
    },
    {
      refreshDeps: [formId, app?.id, spreadsheet, worksheet]
    }
  )

  async function handleOAuth(code: string) {
    const result = await IntegrationService.googleOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  async function fetchDrives() {
    return await IntegrationService.googleDriveList(formId, app?.id as string)
  }

  async function fetchSheets() {
    return await IntegrationService.googleSheetsList(formId, app?.id as string, drive)
  }

  async function fetchWorksheets() {
    const result = await IntegrationService.googleSheetsWorksheets(
      formId,
      app?.id as string,
      spreadsheet!
    )

    return result.map((row: string) => ({
      id: row,
      name: row
    }))
  }

  function handleValuesChange(changed: AnyMap) {
    if (changed.drive) {
      setDrive(changed.drive.id)
    } else if (changed.spreadsheet) {
      setSpreadsheet(changed.spreadsheet.id)
    } else if (changed.worksheet) {
      setWorksheet(changed.worksheet)
    }
  }

  useEffect(() => {
    const attributes = app?.integration?.attributes as AnyMap

    if (helper.isValid(attributes)) {
      if (attributes.drive) {
        setDrive(attributes.drive.id)
      }

      if (attributes.spreadsheet) {
        setSpreadsheet(attributes.spreadsheet.id)
      }

      if (attributes.worksheet) {
        setWorksheet(attributes.worksheet)
      }
    }
  }, [])

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app} onValuesChange={handleValuesChange}>
      {/* Select drive */}
      <Form.Item
        name="drive"
        label={t('form.integrations.googledrive.drive.headline')}
        footer={
          <Trans
            t={t}
            i18nKey="form.integrations.googledrive.drive.footer"
            components={{
              a: (
                <a
                  className="text-primary underline"
                  href="https://support.google.com/a/users/answer/9310351"
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }}
          />
        }
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[isAuthorized]}
          options={
            app.integration?.attributes?.drive ? [app.integration.attributes.drive] : undefined
          }
          fetch={fetchDrives}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Select spreadsheet */}
      <Form.Item
        name="spreadsheet"
        label={t('form.integrations.googlesheets.spreadsheet')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[drive]}
          options={
            app.integration?.attributes?.spreadsheet
              ? [app.integration.attributes.spreadsheet]
              : undefined
          }
          fetch={fetchSheets}
          labelKey="name"
          valueKey="id"
          disabled={helper.isNil(drive)}
        />
      </Form.Item>

      {/* Select worksheet */}
      <Form.Item
        name="worksheet"
        label={t('form.integrations.googlesheets.worksheet')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[spreadsheet]}
          fetch={fetchWorksheets}
          labelKey="name"
          valueKey="id"
          disabled={helper.isNil(spreadsheet)}
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
        rightType="number"
        rightLoading={loading}
        rightOptions={sheetFields}
        rightLabelKey="name"
        rightValueKey="id"
        rightPlaceholder={t('form.integrations.mapFields.rightPlaceholder', { name: app?.name })}
      />
    </IntegrationSettingsForm>
  )
}
