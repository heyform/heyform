import { observer } from 'mobx-react-lite'
import { FC } from 'react'

import { DatePicker, Form, Select } from '@/components/ui'
import { TIME_ZONE_OPTIONS } from '@/consts'
import { useStore } from '@/store'

const StartDate: FC = observer(() => {
  return (
    <Form.Item className="mb-0" name="startDate" rules={[{ required: false }]}>
      <DatePicker placeholder="Start date" showTimeSelect />
    </Form.Item>
  )
})

const EndDate: FC = observer(() => {
  const formStore = useStore('formStore')

  return (
    <Form.Item className="mb-0" name="endDate" rules={[{ required: false }]}>
      <DatePicker
        placeholder="Close date"
        minDate={formStore.tempSettings.startDate}
        showTimeSelect
      />
    </Form.Item>
  )
})

const TimeZone: FC = () => {
  return (
    <Form.Item className="mb-0 ml-4 flex-1" name="expirationTimeZone" rules={[{ required: false }]}>
      <Select
        className="timezone-select"
        placeholder="Time zone"
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
