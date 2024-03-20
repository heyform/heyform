import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Modal, notification } from '@/components/ui'
import { UserService } from '@/service'
import { useStore } from '@/store'
import { useVisible } from '@/utils'

const ChangePassword: FC<IModalProps> = ({ visible, onClose }) => {
  const [values, setValues] = useState<IMapType>({})
  const { t } = useTranslation()

  function handleChange(_: unknown, val: IMapType) {
    setValues(val)
  }

  async function handleFinish(val: IMapType) {
    await UserService.updatePassword(val.currentPassword, val.newPassword)

    notification.success({
      title: t('user.settings.password.changeText')
    })
    onClose?.()
  }

  return (
    <Modal contentClassName="max-w-md" visible={visible} showCloseIcon onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('user.settings.password.changeP')}
          </h1>
        </div>

        <Form.Custom
          submitText={t('auth.forgotPassword.continue')}
          submitOptions={{
            type: 'primary'
          }}
          request={handleFinish}
          onValuesChange={handleChange}
        >
          <Form.Item
            name="currentPassword"
            label={t('user.settings.password.currentPassword')}
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('user.settings.password.newP')}
            rules={[
              {
                required: true,
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/,
                message: t('auth.signup.PasswordViolation')
              }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="repeatPassword"
            label={t('auth.resetPassword.repeatPassword')}
            rules={[
              {
                validator: async (rule, value) => {
                  if (helper.isValid(values.newPassword) && value !== values.newPassword) {
                    throw new Error(rule.message as string)
                  }
                },
                message: t('auth.resetPassword.passwordMismatch')
              }
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}

export const Password: FC = observer(() => {
  const userStore = useStore('userStore')
  const [visible, handleOpen, handleClose] = useVisible()
  const { t } = useTranslation()

  if (userStore.user.isSocialAccount) {
    return null
  }

  return (
    <div>
      <div className="block text-sm font-medium text-slate-700">{t('login.Password')}</div>
      <p className="mt-1 text-sm text-slate-500">
        <Button.Link className="text-blue-500" onClick={handleOpen}>
          {t('user.settings.password.changeP')}
        </Button.Link>
      </p>

      <ChangePassword visible={visible} onClose={handleClose} />
    </div>
  )
})
