import { helper } from '@heyform-inc/utils'
import { useBoolean } from 'ahooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Input, Modal, PasswordStrength } from '@/components'
import { UserService } from '@/services'
import { useModal } from '@/store'

export default function ChangePasswordModal() {
  const { t } = useTranslation()

  const { isOpen, onOpenChange } = useModal('ChangePasswordModal')
  const [loading, { set }] = useBoolean(false)
  const [isFocused, setIsFocused] = useState(false)
  const [values, setValues] = useState<AnyMap>({})

  function handleValuesChange(_: any, values: any) {
    setValues(values)
  }

  async function fetch(values: any) {
    await UserService.updatePassword(values.currentPassword, values.password)
  }

  return (
    <Modal.Simple
      open={isOpen}
      title={t('user.password.headline')}
      description={t('user.password.subHeadline')}
      contentProps={{
        className: 'max-w-md'
      }}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <Form.Simple
        className="space-y-4"
        fetch={fetch}
        submitProps={{
          className: 'px-5 w-full bg-error text-primary-light dark:text-primary hover:bg-error',
          size: 'md',
          label: t('components.continue')
        }}
        submitOnChangedOnly
        onLoadingChange={set}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="currentPassword"
          label={t('login.password.label')}
          rules={[
            {
              required: true,
              message: t('login.password.required')
            }
          ]}
        >
          <Input.Password />
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
    </Modal.Simple>
  )
}
