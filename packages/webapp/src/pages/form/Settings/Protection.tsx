import { CaptchaKindEnum } from '@heyform-inc/shared-types-enums'
import { useTranslation } from 'react-i18next'

import { Form, Input, Switch } from '@/components'
import { useFormStore } from '@/store'

export default function FormSettingsProtection() {
  const { t } = useTranslation()
  const { tempSettings } = useFormStore()

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
          className="[&_[data-slot=content]]:pt-1.5"
          name="captchaKind"
          label="Google reCaptcha"
          description={t('form.settings.protection.bot.subHeadline')}
          isInline
        >
          {(control: Any) => (
            <Switch
              value={control.value === CaptchaKindEnum.GOOGLE_RECAPTCHA}
              onChange={value =>
                control.onChange(value ? CaptchaKindEnum.GOOGLE_RECAPTCHA : CaptchaKindEnum.NONE)
              }
            />
          )}
        </Form.Item>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="filterSpam"
          label="Akismet"
          description={t('form.settings.protection.antiSpam.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>
      </div>
    </section>
  )
}
