import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Select, Switch } from '@/components/ui'
import { CAPTCHA_KIND_OPTIONS } from '@/consts'

export const Protection: FC = () => {
  const { t } = useTranslation()

  return (
    <div
      id="form-settings-protection"
      className="form-settings-selection space-y-6 bg-white px-6 pb-8 pt-6 shadow sm:rounded-md"
    >
      <div className="text-lg font-medium text-slate-900">{t('formSettings.Protection')}</div>

      {/* Password protection */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-sm font-medium leading-6 text-slate-900">Password protection</div>
            <p className="mt-1 text-sm text-slate-500">
              Secure your form with a single, easy-to-remember password.
            </p>
          </div>

          <Form.Item className="mb-0 ml-4" name="requirePassword">
            <Switch />
          </Form.Item>
        </div>

        <div className="mt-4">
          <Form.Item
            className="mb-0"
            name="password"
            extra={<p className="text-slate-500">Set the password for this site</p>}
          >
            <Input className="w-full lg:w-[280px]" />
          </Form.Item>
        </div>
      </div>

      {/* Captcha */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.Bots')}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('formSettings.BotsText')}</p>
        </div>

        <Form.Item className="mb-0 ml-4" name="captchaKind" rules={[{ required: true }]}>
          <Select options={CAPTCHA_KIND_OPTIONS} popupClassName="!w-[200px]" />
        </Form.Item>
      </div>

      {/* Anti spam */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.Anti')}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('formSettings.AntiText')}</p>
        </div>

        <Form.Item className="mb-0 ml-4" name="filterSpam" rules={[{ required: true }]}>
          <Switch />
        </Form.Item>
      </div>
    </div>
  )
}
