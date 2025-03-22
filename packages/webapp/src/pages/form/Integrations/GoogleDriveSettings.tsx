import { helper } from '@heyform-inc/utils'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function GoogleDriveSettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [drive, setDrive] = useState<string>()

  async function handleOAuth(code: string) {
    const result = await IntegrationService.googleOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  async function fetchDrives() {
    return await IntegrationService.googleDriveList(formId, app?.id as string)
  }

  async function fetchFolders() {
    return await IntegrationService.googleDriveFolders(formId, app?.id as string, drive)
  }

  function handleValuesChange(changed: AnyMap) {
    if (changed.drive) {
      setDrive(changed.drive.id)
    }
  }

  useEffect(() => {
    const attributes = app?.integration?.attributes as AnyMap

    if (helper.isValid(attributes)) {
      if (attributes.drive) {
        setDrive(attributes.drive.id)
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
          fetch={fetchDrives}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Select folder */}
      <Form.Item
        name="folder"
        label={t('form.integrations.googledrive.folder.headline')}
        footer={t('form.integrations.googledrive.folder.footer')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          returnOptionAsValue
          refreshDeps={[drive]}
          fetch={fetchFolders}
          labelKey="name"
          valueKey="id"
          disabled={helper.isNil(drive)}
        />
      </Form.Item>
    </IntegrationSettingsForm>
  )
}
