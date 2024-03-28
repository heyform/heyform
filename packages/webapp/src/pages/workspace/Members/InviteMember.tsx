import { helper, unixDate } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Modal, notification, useForm } from '@/components/ui'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

export const InviteMember: FC<IModalProps> = observer(({ visible, onClose }) => {
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const [form] = useForm()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function handleFinish(values: any) {
    const emails = values.emails.filter((e: string) => helper.isValid(e))

    if (helper.isEmpty(emails)) {
      setError(new Error(t('workspace.members.inputPrompt')))
      return
    }

    setLoading(true)

    try {
      await WorkspaceService.sendInvites(workspaceId, emails)
      form.resetFields()

      notification.success({
        title: t('workspace.members.send')
      })
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('workspace.members.inviteMember')} <span>{workspaceStore.project?.name}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('workspace.members.inviteExplain')}{' '}
            <span className="text-slate-700">
              {unixDate(workspaceStore.workspace?.inviteCodeExpireAt || 0).format('MMMM DD, YYYY')}
            </span>
            .
          </p>
        </div>

        <Form
          initialValues={{
            emails: ['', '', '']
          }}
          form={form}
          onFinish={handleFinish}
        >
          <Form.List name="emails">
            {(fields, { add }) => {
              function handleAdd() {
                add('')
              }

              return (
                <div>
                  {fields.map(field => (
                    <Form.Item
                      {...field}
                      rules={[
                        {
                          type: 'email',
                          required: false,
                          message: t('auth.signup.invalidEmail')
                        }
                      ]}
                    >
                      <Input placeholder="name@example.com" />
                    </Form.Item>
                  ))}

                  <div className="flex items-center justify-between">
                    <Button.Link onClick={handleAdd}>{t('workspace.members.Add')}</Button.Link>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      {t('workspace.members.sendBottom')}
                    </Button>
                  </div>

                  {error && <div className="form-item-error">{error.message}</div>}
                </div>
              )
            }}
          </Form.List>
        </Form>
      </div>
    </Modal>
  )
})
