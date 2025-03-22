import { helper } from '@heyform-inc/utils'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Form, Input, PasswordStrength } from '@/components'
import { AuthService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from '@/utils'

const ResetPassword = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const { temporaryEmail, setTemporaryEmail } = useUserStore()

  const [isFocused, setIsFocused] = useState(false)
  const [values, setValues] = useState<AnyMap>({})

  function handleValuesChange(_: any, values: any) {
    setValues(values)
  }

  async function fetch(values: any) {
    await AuthService.resetPassword({
      email: temporaryEmail!,
      code: values.code,
      password: values.password
    })

    router.push('/login')
  }

  useEffect(() => {
    if (helper.isEmpty(temporaryEmail)) {
      router.replace('/forgot-password')
    }

    return () => {
      setTemporaryEmail(undefined)
    }
  }, [])

  return (
    <div className="mx-auto grid w-[21.875rem] gap-6 py-12 lg:py-0">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('resetPassword.title')}</h1>
        <p className="text-sm text-secondary">
          {t('resetPassword.subHeadline', { email: temporaryEmail })}
        </p>
      </div>

      <Form.Simple
        className="space-y-4"
        fetch={fetch}
        submitProps={{
          label: t('components.continue'),
          className: 'w-full'
        }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="code"
          label={t('resetPassword.verificationCode.label')}
          rules={[
            {
              required: true,
              message: t('resetPassword.verificationCode.required')
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="flex items-center justify-between">
              <span>{t('resetPassword.newPassword.label')}</span>
              <PasswordStrength
                className={
                  isFocused || !helper.isNil(values.password) ? 'opacity-100' : 'opacity-0'
                }
                password={values.password}
              />
            </div>
          }
          rules={[
            {
              required: true,
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/,
              message: t('components.password.invalid')
            },
            {
              max: 100,
              message: t('login.password.maxLength')
            }
          ]}
        >
          <Input.Password onBlur={() => setIsFocused(false)} onFocus={() => setIsFocused(true)} />
        </Form.Item>

        <Form.Item
          name="password2"
          label={t('resetPassword.repeatPassword.label')}
          rules={[
            {
              validator: async (rule, value) => {
                if (helper.isValid(values.password) && value !== values.password) {
                  throw new Error(rule.message as string)
                }
              },
              message: t('resetPassword.repeatPassword.invalid')
            }
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form.Simple>

      <p className="text-center text-sm text-secondary">
        <Trans
          t={t}
          i18nKey="forgotPassword.toLogin"
          components={{
            a: <Link className="underline underline-offset-4 hover:text-primary" to="/login" />
          }}
        />
      </p>
    </div>
  )
}

export default ResetPassword
