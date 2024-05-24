import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { DatePicker, Form, Select } from '@/components/ui'
import { TIME_ZONE_OPTIONS } from '@/consts'
import { useStore } from '@/store'

const StartDate: FC = observer(() => {
	const { t } = useTranslation()

  return (
    <Form.Item className="mb-0" name="startDate" rules={[{ required: false }]}>
      <DatePicker placeholder={t('formSettings.startDate')} showTimeSelect />
    </Form.Item>
  )
})

const EndDate: FC = observer(() => {
  const formStore = useStore('formStore')
	const { t } = useTranslation()

  return (
    <Form.Item className="mb-0" name="endDate" rules={[{ required: false }]}>
      <DatePicker
        placeholder={t('formSettings.closeDate')}
        minDate={formStore.tempSettings.startDate}
        showTimeSelect
      />
    </Form.Item>
  )
})

const TimeZone: FC = () => {
	const { t } = useTranslation()

  return (
    <Form.Item className="mb-0 ml-4 flex-1" name="expirationTimeZone" rules={[{ required: false }]}>
      <Select
        className="timezone-select"
        placeholder={t('formSettings.timeZone')}
        options={TIME_ZONE_OPTIONS}
        allowInput={false}
      />
    </Form.Item>
  )
}

export const ExpirationDate: FC = () => {
  return (
    <div className="flex items-center">
      <StartDate />
      <span className="px-2">-</span>
      <EndDate />
      <TimeZone />
    </div>
  )
}
