import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DatePicker, Form, Input, Select, Switch } from '@/components'
import { TIMEZONES } from '@/consts'
import { useFormStore } from '@/store'

export default function FormSettingsAccess() {
  const { t, i18n } = useTranslation()
  const { tempSettings } = useFormStore()

  const timezoneItems = useMemo(
    () =>
      TIMEZONES.map(row => ({
        label: `(GMT${row.gmt}) ${t(row.label)}`,
        value: row.value
      })),
    [t]
  )

  const countdownItems = useMemo(
    () => [
      {
        label: t('form.settings.access.countdown.hours'),
        value: 'h',
        min: 1
      },
      {
        label: t('form.settings.access.countdown.minutes'),
        value: 'm',
        min: 1
      },
      {
        label: t('form.settings.access.countdown.seconds'),
        value: 's',
        min: 1
      }
    ],
    [t]
  )

  const ipLimitTimeItems = useMemo(
    () => [
      {
        label: t('form.settings.access.countdown.days'),
        value: 'd',
        min: 1
      },
      {
        label: t('form.settings.access.countdown.hours'),
        value: 'h',
        min: 1
      },
      {
        label: t('form.settings.access.countdown.minutes'),
        value: 'm',
        min: 1
      }
    ],
    [t]
  )

  return (
    <section id="access" className="pt-10">
      <h2 className="text-lg font-semibold">{t('form.settings.access.title')}</h2>

      <div className="mt-4 space-y-8">
        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="closeForm"
          label={t('form.settings.access.closeForm.headline')}
          description={t('form.settings.access.closeForm.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableExpirationDate"
            label={t('form.settings.access.scheduledDate.headline')}
            description={t('form.settings.access.scheduledDate.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableExpirationDate && (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="startDate">
                <DatePicker
                  locale={i18n.language}
                  maxDate={tempSettings?.endDate}
                  startDate={tempSettings?.startDate}
                  endDate={tempSettings?.endDate}
                  placeholder={t('form.settings.access.scheduledDate.startDate')}
                  selectsStart
                  showTimeSelect
                />
              </Form.Item>

              <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="endDate">
                <DatePicker
                  locale={i18n.language}
                  minDate={tempSettings?.startDate}
                  startDate={tempSettings?.startDate}
                  endDate={tempSettings?.endDate}
                  placeholder={t('form.settings.access.scheduledDate.endDate')}
                  selectsEnd
                  showTimeSelect
                />
              </Form.Item>

              <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="expirationTimeZone">
                <Select.Native
                  className="-mt-2 cursor-pointer appearance-none border-none bg-none px-0 py-2.5 text-secondary hover:text-primary focus:text-primary focus:outline-none focus:ring-0 sm:mt-0 sm:px-0"
                  options={timezoneItems}
                />
              </Form.Item>
            </div>
          )}
        </div>

        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableTimeLimit"
            label={t('form.settings.access.countdown.headline')}
            description={t('form.settings.access.countdown.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableTimeLimit && (
            <Form.Item name="_timeLimit">
              <Input.TypeNumber className="[&_[data-slot=number]]:w-16" options={countdownItems} />
            </Form.Item>
          )}
        </div>

        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableIpLimit"
            label={t('form.settings.access.limitIP.headline')}
            description={t('form.settings.access.limitIP.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableIpLimit && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Form.Item name="ipLimitCount">
                <Input
                  type="number"
                  className="[&_[data-slot=number]]:w-16"
                  trailing={t('form.settings.access.limitIP.times')}
                />
              </Form.Item>

              <div>{t('form.settings.access.limitIP.inEvery')}</div>

              <Form.Item name="_ipLimitTime">
                <Input.TypeNumber
                  className="[&_[data-slot=number]]:w-16"
                  options={ipLimitTimeItems}
                />
              </Form.Item>
            </div>
          )}
        </div>

        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableQuotaLimit"
            label={t('form.settings.access.quotaLimit.headline')}
            description={t('form.settings.access.quotaLimit.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableQuotaLimit && (
            <Form.Item
              name="quotaLimit"
              rules={[
                {
                  type: 'number',
                  required: true,
                  min: 1,
                  message: t('formSettings.dataError')
                }
              ]}
            >
              <Input className="w-full sm:w-32" type="number" />
            </Form.Item>
          )}
        </div>

        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="enableClosedMessage"
            label={t('form.settings.access.closedMessage.headline')}
            description={t('form.settings.access.closedMessage.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.enableClosedMessage && (
            <>
              <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="closedFormTitle">
                <Input
                  className="w-full"
                  placeholder={t('form.settings.access.closedMessage.title')}
                />
              </Form.Item>

              <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="closedFormDescription">
                <Input.TextArea
                  className="w-full"
                  rows={5}
                  placeholder={t('form.settings.access.closedMessage.description')}
                />
              </Form.Item>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
