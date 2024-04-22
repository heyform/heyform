import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { TimeInput } from '@/components/TimeInput'
import { Form, Input, Select, Switch } from '@/components/ui'
import { FORM_LOCALES_OPTIONS, IP_LIMIT_OPTIONS, TIME_LIMIT_OPTIONS } from '@/consts'
import { SubmissionArchive } from '@/pages/form/FormSettings/SubmissionArchive'
import { useStore } from '@/store'

export const Basic: FC = observer(() => {
  const { t } = useTranslation()
  const formStore = useStore('formStore')

  return (
    <div
      id="form-settings-basic"
      className="form-settings-selection space-y-6 bg-white px-6 pb-8 pt-6 shadow sm:rounded-md"
    >
      <div className="text-lg font-medium text-slate-900">Basic</div>

      {/* Language */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.primaryLanguage')}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('formSettings.languageDescription')}</p>
        </div>

        <Form.Item className="mb-0 ml-4" name="locale" rules={[{ required: false }]}>
          <Select options={FORM_LOCALES_OPTIONS} popupClassName="locale-select !w-[160px]" />
        </Form.Item>
      </div>

      {/* Translations */}
      <div className="space-y-2">
        <div>
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.languages')}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <Trans
              i18nKey="formSettings.translationsDescription"
              t={t}
              components={{
                a: (
                  <a
                    href="https://openai.com/chatgpt"
                    className="text-slate-500 underline hover:text-blue-600"
                    target="_blank"
                  />
                )
              }}
            />
          </p>
        </div>

        <Form.Item className="mb-0" name="languages" rules={[{ required: false }]}>
          <Select.Multiple
            allowSearch={false}
            options={FORM_LOCALES_OPTIONS}
            popupClassName="locale-select !w-[160px]"
          />
        </Form.Item>
      </div>

      {/* Submission archive */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.subArchive')}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('formSettings.archiveText')}</p>
        </div>

        <Form.Item className="mb-0 ml-4" name="allowArchive" rules={[{ required: false }]}>
          <SubmissionArchive />
        </Form.Item>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium leading-6 text-slate-900">
            {t('formSettings.progressBar')}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('formSettings.progressText')}</p>
        </div>

        <Form.Item className="mb-0 ml-4" name="enableProgress" rules={[{ required: false }]}>
          <Switch />
        </Form.Item>
      </div>

      {/* Time limit */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-sm font-medium leading-6 text-slate-900">
              {t('formSettings.timeLimit')}
            </div>
            <p className="mt-1 text-sm text-slate-500">{t('formSettings.timeText')}</p>
          </div>

          <Form.Item className="mb-0 ml-4" name="enableTimeLimit" rules={[{ required: false }]}>
            <Switch />
          </Form.Item>
        </div>

        {formStore.tempSettings.enableTimeLimit && (
          <Form.Item className="mb-0" name="timeLimit" rules={[{ required: false }]}>
            <TimeInput options={TIME_LIMIT_OPTIONS} />
          </Form.Item>
        )}
      </div>

      {/* IP limit */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-slate-900">{t('formSettings.IpLimit')}</div>
            <p className="mt-1 text-sm text-slate-500">{t('formSettings.IpLimitText')}</p>
          </div>

          <Form.Item className="mb-0 ml-4" name="enableIpLimit" rules={[{ required: false }]}>
            <Switch />
          </Form.Item>
        </div>

        {formStore.tempSettings.enableIpLimit && (
          <div className="flex items-center">
            <Form.Item
              className="mb-0"
              name="ipLimitCount"
              rules={[
                {
                  type: 'number',
                  required: true,
                  min: 1,
                  message: t('formSettings.dataError')
                }
              ]}
            >
              <Input className="w-32" type="number" trailing="times" />
            </Form.Item>

            <span className="px-2 text-sm text-slate-500"> in every </span>

            <Form.Item
              className="mb-0"
              name="ipLimitTime"
              rules={[
                {
                  type: 'number',
                  required: true,
                  min: 1,
                  message: t('formSettings.dataError')
                }
              ]}
            >
              <TimeInput options={IP_LIMIT_OPTIONS} />
            </Form.Item>
          </div>
        )}
      </div>
    </div>
  )
})
