import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Modal } from '@/components/ui'
import { UserService } from '@/service'
import { useStore } from '@/store'
import { useVisible } from '@/utils'

export interface FormValues {
  email: string
  password: string
}

interface SendCodeProps extends Omit<IModalProps, 'onComplete'> {
  onComplete?: (formValues: FormValues) => void
}

interface VerifyEmailProps extends IModalProps {
  formValues?: FormValues
}

export const SendCode: FC<SendCodeProps> = ({ visible, onClose, onComplete }) => {
  async function handleFinish(values: FormValues) {
    await UserService.changeEmailCode(values.password, values.email)

    onClose?.()
    onComplete?.(values)
  }

  const { t } = useTranslation()
  return (
    <Modal contentClassName="max-w-md" visible={visible} showCloseIcon onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('user.settings.emailAddress.change')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('user.settings.emailAddress.sendEmail')}</p>
        </div>

        <Form.Custom
          submitText={t('user.settings.emailAddress.send')}
          submitOptions={{
            type: 'primary'
          }}
          request={handleFinish}
        >
          <Form.Item
            name="email"
            label={t('user.settings.emailAddress.newEmail')}
            rules={[{ type: 'email', required: true }]}
          >
            <Input type="email" />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}

export const VerifyEmail: FC<VerifyEmailProps> = ({ visible, formValues, onClose, onComplete }) => {
  async function handleFinish(values: IMapType) {
    await UserService.updateEmail(formValues!.email, formValues!.password, values.code)

    onClose?.()
    onComplete?.()
  }

  const { t } = useTranslation()
  return (
    <Modal contentClassName="max-w-md" visible={visible} showCloseIcon onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('user.settings.emailAddress.checkEmail')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('user.settings.emailAddress.code')} {formValues?.email}.
          </p>
        </div>

        <Form.Custom
          submitText={t('user.settings.emailAddress.continue')}
          submitOptions={{
            type: 'primary'
          }}
          request={handleFinish}
        >
          <Form.Item name="code" label="Verification code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form.Custom>
      </div>
    </Modal>
  )
}

export const EmailAddress: FC = observer(() => {
  const userStore = useStore('userStore')
  const [sendCodeVisible, openSendCode, closeSendCode] = useVisible()
  const [verifyEmailVisible, openVerifyEmail, closeVerifyEmail] = useVisible()
  const [formValues, setTempValues] = useState<FormValues>()
  const { t } = useTranslation()

  function handleSendComplete(values: FormValues) {
    setTempValues(values)
    openVerifyEmail()
  }

  function handleVerifyComplete() {
    userStore.update({
      email: formValues?.email
    })
  }

  return (
    <div>
      <div className="block text-sm font-medium text-slate-700">{t('login.Email')}</div>
      <p className="mt-1 text-sm text-slate-500">
        <span>{userStore.user.email}</span>

        {!userStore.user.isSocialAccount && (
          <Button.Link className="ml-2 text-blue-500" onClick={openSendCode}>
            {t('user.settings.emailAddress.changeEmail')}
          </Button.Link>
        )}
      </p>

      <SendCode visible={sendCodeVisible} onClose={closeSendCode} onComplete={handleSendComplete} />
      <VerifyEmail
        visible={verifyEmailVisible}
        formValues={formValues}
        onClose={closeVerifyEmail}
        onComplete={handleVerifyComplete}
      />
    </div>
  )
})
