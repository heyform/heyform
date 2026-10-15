import { useTranslation } from 'react-i18next'

import { Form, Input, Switch } from '@/components'
import { useFormStore } from '@/store'

import {
  MAX_NOTIFICATION_RECIPIENTS,
  parseNotificationRecipients,
  validateNotificationRecipients
} from './notificationRecipients'

export default function FormSettingsEmailNotification() {
  const { t } = useTranslation()
  const { tempSettings } = useFormStore()

  return (
    <section id="emailNotification" className="pt-10">
      <h2 className="hf-section-title">{t('form.settings.emailNotification.title')}</h2>

      <div className="mt-4 space-y-8">
        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableEmailNotification"
            label={t('form.settings.emailNotification.self.headline')}
            description={t('form.settings.emailNotification.self.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableEmailNotification && (
            <Form.Item
              className="mt-4"
              name="_notificationRecipients"
              label={t('form.settings.emailNotification.recipients.headline')}
              description={t('form.settings.emailNotification.recipients.subHeadline', {
                max: MAX_NOTIFICATION_RECIPIENTS
              })}
              rules={[
                {
                  validator: async (_, value?: string) => {
                    const error = validateNotificationRecipients(parseNotificationRecipients(value))

                    if (error) {
                      throw new Error(t(error.key, error.values))
                    }
                  }
                }
              ]}
            >
              <Input.TextArea
                autoComplete="off"
                placeholder={t('form.settings.emailNotification.recipients.placeholder')}
              />
            </Form.Item>
          )}
        </div>
      </div>
    </section>
  )
}
