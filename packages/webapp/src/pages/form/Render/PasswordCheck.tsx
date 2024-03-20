import { FormModel } from '@heyform-inc/shared-types-enums'
import { useState } from 'react'

import { Button, Form, Input } from '@/components/ui'
import { FormService } from '@/service'

interface PasswordCheckProps {
  form: FormModel
  onFinish: (passwordToken: string) => void
}

export const PasswordCheck = ({ form, onFinish }: PasswordCheckProps): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

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
    <div className="heyform-root">
      <div className="heyform-block-container heyform-short-text">
        <div className="heyform-theme-background"></div>
        <div className="heyform-block heyform-block-next heyform-block-entered">
          <div className="scrollbar h-full w-full overflow-x-hidden px-6 md:px-20">
            <div className="heyform-scroll-container">
              <div className="heyform-block-main">
                <div className="mb-20 mt-12 md:mb-36 md:mt-20">
                  <div className="mb-10">
                    <h1 className="heyform-block-title">Password required</h1>
                  </div>
                  <Form onFinish={handleFinish}>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'This field is required' }]}
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
                        <Button type="primary" htmlType="submit" loading={loading}>
                          Continue
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
