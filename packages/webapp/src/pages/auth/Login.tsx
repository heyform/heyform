import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AuthService } from '@/services'
import { useRouter } from '@/utils'

import { Form, Input } from '@/components'
import { DISABLE_EMAIL_LOGIN, isRegistrationDisabled } from '@/consts'

import SocialLogin from './SocialLogin'

const Login = () => {
  const { t } = useTranslation()
  const router = useRouter()

  async function fetch(values: any) {
    await AuthService.login(values)
    router.replace('/')
  }

  return (
    <div className="mx-auto grid w-[21.875rem] gap-6 py-12 lg:py-0">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('login.headline')}</h1>
        {!isRegistrationDisabled() && (
          <p className="text-secondary text-sm">
            <Trans
              t={t}
              i18nKey="login.subHeadline"
              components={{
                a: (
                  <Link
                    key="sign-up"
                    className="hover:text-primary underline underline-offset-4"
                    to="/sign-up"
                  />
                )
              }}
            />
          </p>
        )}
      </div>

      <SocialLogin />

      {!DISABLE_EMAIL_LOGIN && <Form.Simple
        className="space-y-4"
        fetch={fetch}
        submitProps={{
          label: t('login.title'),
          className: 'w-full'
        }}
      >
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
              <Link to="/forgot-password" className="text-sm underline" tabIndex={-1}>
                {t('login.forgotPassword')}
              </Link>
            </div>
          }
          rules={[
            {
              required: true,
              message: t('login.password.required')
            }
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form.Simple>}
    </div>
  )
}

export default Login
