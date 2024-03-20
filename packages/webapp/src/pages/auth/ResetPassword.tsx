import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input } from '@/components/ui'
import { AuthService } from '@/service'
import { useStore } from '@/store'
import { useQueryURL, useRouter } from '@/utils'

const ResetPassword = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const appStore = useStore('appStore')
  const [values, setValues] = useState<IMapType>({})
  const nextURL = useQueryURL('/login')

  function handleChange(_: unknown, val: IMapType) {
    setValues(val)
  }

  async function handleFinish(val: IMapType) {
    await AuthService.resetPassword(appStore.resetPasswordEmail, val.newPassword, val.code)
    router.push(nextURL)
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {t('auth.resetPassword.reset')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('auth.resetPassword.sentEmail')}{' '}
          <span className="font-medium text-slate-700">{appStore.resetPasswordEmail}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <Form.Custom
            submitText={t('auth.forgotPassword.continue')}
            submitOptions={{
              type: 'primary',
              block: true
            }}
            request={handleFinish}
            onValuesChange={handleChange}
          >
            <Form.Item
              name="code"
              label={t('auth.resetPassword.verificationCode')}
              rules={[{ required: true, message: t('auth.resetPassword.invalidCode') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={t('auth.resetPassword.newPassword')}
              rules={[
                {
                  required: true,
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/,
                  message: t('auth.resetPassword.passwordViolation')
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
      </div>
    </div>
  )
}

export default observer(ResetPassword)
