import { helper } from '@heyform-inc/utils'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Form, Input, PasswordStrength } from '@/components'
import { AuthService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from '@/utils'

import SocialLogin from './SocialLogin'

const SignUp = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const { setTemporaryEmail } = useUserStore()

  const [isFocused, setIsFocused] = useState(false)
  const [password, setPassword] = useState<string>()

  function handleValuesChange(_: any, values: any) {
    setPassword(values.password)
  }

  async function fetch(values: any) {
    await AuthService.signUp(values)

    setTemporaryEmail(values.email)
    router.replace('/verify-email')
  }

  return (
    <div className="mx-auto grid w-[21.875rem] gap-6 py-12 lg:py-0">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('signUp.title')}</h1>
        <p className="text-sm text-secondary">{t('signUp.subHeadline')}</p>
      </div>

      <SocialLogin isSignUp />

      <Form.Simple
        className="space-y-4"
        fetch={fetch}
        submitProps={{
          label: t('signUp.title'),
          className: 'w-full'
        }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="name"
          label={t('signUp.name.label')}
          rules={[
            {
              required: true,
              message: t('signUp.name.required')
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('login.email.label')}
          rules={[
            {
              required: true,
              message: t('login.email.required')
            },
            {
              type: 'email',
              message: t('login.email.invalid')
            }
          ]}
        >
          <Input type="email" />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="flex items-center justify-between">
              <span>{t('login.password.label')}</span>
              <PasswordStrength
                className={isFocused || !helper.isNil(password) ? 'opacity-100' : 'opacity-0'}
                password={password}
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
          <Input.Password onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
        </Form.Item>
      </Form.Simple>

      <div className="space-y-2 text-center text-sm text-secondary">
        <p>
          <Trans
            t={t}
            i18nKey="signUp.agreement"
            components={{
              a1: (
                <a
                  className="underline underline-offset-4 hover:text-primary"
                  href="https://docs.heyform.net/terms-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              a2: (
                <a
                  className="underline underline-offset-4 hover:text-primary"
                  href="https://docs.heyform.net/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              )
            }}
          />
        </p>

        <p>
          <Trans
            t={t}
            i18nKey="signUp.haveAccount"
            components={{
              a: <Link className="underline underline-offset-4 hover:text-primary" to="/login" />
            }}
          />
        </p>
      </div>
    </div>
  )
}

export default SignUp
