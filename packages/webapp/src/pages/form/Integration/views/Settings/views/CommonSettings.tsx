/**
 * @program: dashboard-next
 * @description: Mailchimp
 * @author: Mufeng
 * @date: 2021-06-16 11:18
 **/
import { FC } from 'react'

import { Form, Input } from '@/components/ui'

import { SettingsProps, SettingsWrapper } from './SettingsWrapper'

export const CommonSettings: FC<SettingsProps> = ({ app, options = [], onFinish }) => {
  return (
    <SettingsWrapper app={app} onFinish={onFinish}>
      {options.map((row, index) => (
        <Form.Item
          key={index}
          name={row.name}
          label={row.label}
          extra={row.description}
          rules={row.rules}
        >
          <Input placeholder={row.placeholder} />
        </Form.Item>
      ))}
    </SettingsWrapper>
  )
}
