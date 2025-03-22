import { helper, toSecond } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { useForm as useRCForm } from 'rc-field-form'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnchorNavigation, Button, Form } from '@/components'
import { FormService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import FormSettingsAccess from './Access'
import FormSettingsEmailNotification from './EmailNotification'
import FormSettingsGeneral from './General'
import FormSettingsProtection from './Protection'
import FormSettingsTranslations from './Translations'

export default function FormSettings() {
  const { t } = useTranslation()

  const [rcForm] = useRCForm()
  const { formId } = useParam()
  const { isFormLoaded, tempSettings, updateTempSettings, updateForm } = useFormStore()
  const [isDisabled, setDisabled] = useState(true)

  const { loading, error, run } = useRequest(
    async (settings: AnyMap) => {
      if (settings.startDate) {
        settings.enabledAt = settings.startDate.tz(settings.expirationTimeZone, true).unix()
        delete settings.startDate
      }

      if (settings.endDate) {
        settings.closedAt = settings.endDate.tz(settings.expirationTimeZone, true).unix()
        delete settings.endDate
      }

      if (settings._timeLimit) {
        settings.timeLimit = toSecond(
          [settings._timeLimit.value, settings._timeLimit.type].join('')
        )
        delete settings._timeLimit
      }

      if (settings._ipLimitTime) {
        settings.ipLimitTime = toSecond(
          [settings._ipLimitTime.value, settings._ipLimitTime.type].join('')
        )
        delete settings._ipLimitTime
      }

      // Form status
      settings.active = !settings.closeForm
      delete settings.closeForm

      // Translations
      if (helper.isValid(settings.languages)) {
        settings.languages = settings.languages.filter((l: string) => l !== settings.locale)
      }

      // Save form settings
      await FormService.update(formId, settings)

      updateForm({ settings })
      setDisabled(true)
    },
    {
      manual: true,
      refreshDeps: [formId]
    }
  )

  const handleValuesChange = useCallback(
    (changes: AnyMap) => {
      updateTempSettings(changes)

      if (isFormLoaded) {
        setDisabled(false)
      }
    },
    [isFormLoaded, updateTempSettings]
  )

  useEffect(() => {
    if (isFormLoaded) {
      rcForm.resetFields()
    }
  }, [rcForm, isFormLoaded])

  return (
    <div className="mt-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-16 lg:space-y-0">
        <aside className="-mx-3 lg:w-1/4">
          <AnchorNavigation
            menus={[
              {
                label: t('form.settings.general.title'),
                value: 'general'
              },
              {
                label: t('form.settings.access.title'),
                value: 'access'
              },
              {
                label: t('form.settings.emailNotification.title'),
                value: 'emailNotification'
              },
              {
                label: t('form.settings.translations.title'),
                value: 'translations'
              },
              {
                label: t('form.settings.protection.title'),
                value: 'protection'
              }
            ]}
          />
        </aside>

        <div className="flex-1">
          <Form
            className="space-y-10 divide-y divide-accent-light"
            form={rcForm}
            initialValues={tempSettings}
            onValuesChange={handleValuesChange}
            onFinish={run}
          >
            <FormSettingsGeneral />
            <FormSettingsAccess />
            <FormSettingsEmailNotification />
            <FormSettingsTranslations />
            <FormSettingsProtection />

            <div className="sticky bottom-0 mt-10 flex items-center justify-end gap-x-4 border-t border-accent bg-foreground py-6">
              {error && !loading && <div className="text-sm/6 text-error">{error.message}</div>}

              <Button type="submit" loading={loading} disabled={isDisabled}>
                {t('components.saveChanges')}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}
