import { useTranslation } from 'react-i18next'

import { RedirectUriLink } from '@/components'
import { Form, Input } from '@/components/ui'
import { VERIFY_USER_EMAIL } from '@/consts'
import { AuthService } from '@/service'
import { useQueryURL, useRouter } from '@/utils'

import { ThirdPartyLogin } from './views/ThirdPartyLogin'

const SignUp = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const nextURL = useQueryURL(VERIFY_USER_EMAIL ? '/verify-email' : '/')

  async function handleFinish(values: any) {
    await AuthService.signUp(values)
    router.redirect(nextURL)
  }

  return (
    <div>
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {t('auth.signup.signUp')}
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <ThirdPartyLogin
            headline={t('auth.signup.signWith')}
            subHeadline={t('auth.signup.continueWith')}
          />

          <div className="mt-6">
            <Form.Custom
              submitText={t('auth.signup.button')}
              submitOptions={{
                type: 'primary',
                className: 'mt-3',
                block: true
              }}
              request={handleFinish}
            >
              <Form.Item
                name="name"
                label={t('auth.signup.Name')}
                rules={[{ required: true, message: t('auth.signup.nameCant') }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('auth.signup.Email')}
                rules={[{ type: 'email', required: true, message: t('auth.signup.invalidEmail') }]}
              >
                <Input type="email" />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('login.Password')}
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

              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  {t('auth.signup.agreeTo')}{' '}
                  <a
                    href="https://docs.heyform.net/terms-conditions"
                    className="font-medium text-slate-700 underline"
                    target="_blank"
                  >
                    {t('auth.signup.terms')}
                  </a>{' '}
                  {t('auth.signup.and')}{' '}
                  <a
                    href="https://docs.heyform.net/privacy-policy"
                    className="font-medium text-slate-700 underline"
                    target="_blank"
                  >
                    {t('auth.signup.privacy')}
                  </a>
                  .
                </p>
              </div>
            </Form.Custom>

            <div className="mt-6 text-center text-blue-700 hover:text-blue-800 sm:text-sm">
              <RedirectUriLink href="/login" className="inline-flex items-center">
                {t('auth.forgotPassword.link')}
              </RedirectUriLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
