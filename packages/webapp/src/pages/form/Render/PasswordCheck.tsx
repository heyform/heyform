import { FormModel } from '@heyform-inc/shared-types-enums'
import { JSX, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input } from '@/components'
import { Button } from '@/components/Button'
import { FormService } from '@/services'

interface PasswordCheckProps {
  form: FormModel
  onFinish: (passwordToken: string) => void
}

export const PasswordCheck = ({ form, onFinish }: PasswordCheckProps): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const { t } = useTranslation()

  async function handleFinish(values: Record<string, any>): Promise<void> {
    if (loading) {
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const result = await FormService.verifyFormPassword(form.id, values.password)

      onFinish(result)
    } catch (err: any) {
      setError(err.response?.errors[0].message || err.message)
    }

    setLoading(false)
  }

  return (
    <div className="heyform-root !h-screen">
      <div className="heyform-block-container heyform-short-text">
        <div className="heyform-theme-background"></div>
        <div className="heyform-block heyform-block-next heyform-block-entered">
          <div className="scrollbar h-full w-full overflow-x-hidden px-6 md:px-20">
            <div className="heyform-scroll-container">
              <div className="heyform-block-main">
                <div className="mb-20 mt-12 md:mb-36 md:mt-20">
                  <div className="mb-10">
                    <h1 className="heyform-block-title">{t('formSettings.passwordRequired')}</h1>
                  </div>
                  <Form onFinish={handleFinish}>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: t('formSettings.passwordRequiredError') }]}
                    >
                      <Input />
                    </Form.Item>
                    {error && (
                      <div className="mt-4">
                        <div className="heyform-form-field-error">{error}</div>
                      </div>
                    )}
                    <Form.Item>
                      <div className="heyform-submit-container">
                        <Button variant="default" type="submit" loading={loading}>
                          {t('auth.forgotPassword.continue')}
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
