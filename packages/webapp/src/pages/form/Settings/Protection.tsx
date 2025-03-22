import { CaptchaKindEnum } from '@heyform-inc/shared-types-enums'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Select, Switch } from '@/components'
import { useFormStore } from '@/store'

export default function FormSettingsProtection() {
  const { t } = useTranslation()
  const { tempSettings } = useFormStore()

  const options = useMemo(
    () => [
      {
        label: t('components.disabled'),
        value: CaptchaKindEnum.NONE
      },
      {
        label: 'Google reCaptcha',
        value: CaptchaKindEnum.GOOGLE_RECAPTCHA
      },
      {
        label: 'GeeTest CAPTCHA',
        value: CaptchaKindEnum.GEETEST_CAPTCHA
      }
    ],
    [t]
  )

  return (
    <section id="protection" className="pt-10">
      <h2 className="text-lg font-semibold">{t('form.settings.protection.title')}</h2>

      <div className="mt-4 space-y-8">
        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="requirePassword"
            label={t('form.settings.protection.password.headline')}
            description={t('form.settings.protection.password.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.requirePassword && (
            <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="password">
              <Input className="sm:w-40" maxLength={10} />
            </Form.Item>
          )}
        </div>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5 [&_[data-slot=control]]:flex-col [&_[data-slot=control]]:sm:flex-row"
          name="captchaKind"
          label={t('form.settings.protection.bot.headline')}
          description={t('form.settings.protection.bot.subHeadline')}
          isInline
        >
          <Select
            type="number"
            className="w-full min-w-40 sm:w-auto [&_[data-slot=translated]]:hidden"
            options={options}
          />
        </Form.Item>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="filterSpam"
          label={t('form.settings.protection.antiSpam.headline')}
          description={t('form.settings.protection.antiSpam.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>
      </div>
    </section>
  )
}
