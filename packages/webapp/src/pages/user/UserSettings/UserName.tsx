import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input } from '@/components/ui'
import { UserService } from '@/service'
import { useStore } from '@/store'

export const UserName: FC = observer(() => {
  const userStore = useStore('userStore')
  const { t } = useTranslation()

  async function handleFinish(values: IMapType) {
    await UserService.update(values)
    userStore.update(values)
  }

  return (
    <div>
      <Form.Custom
        inline
        initialValues={{
          name: userStore.user.name
        }}
        submitText={t('workspace.settings.up')}
        submitOptions={{
          className: 'mt-6 ml-3'
        }}
        request={handleFinish}
      >
        <Form.Item name="name" label={t('user.settings.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form.Custom>
    </div>
  )
})
