import { useBoolean, useRequest } from 'ahooks'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Input, Modal, useToast } from '@/components'
import { UserService } from '@/services'
import { useModal, useUserStore } from '@/store'
import { clearAuthState } from '@/utils'

export default function UserDeletionModal() {
  const { t } = useTranslation()

  const toast = useToast()
  const { user } = useUserStore()

  const { isOpen, onOpenChange } = useModal('UserDeletionModal')
  const [loading, { set }] = useBoolean(false)

  const { run } = useRequest(
    async () => {
      await UserService.sendDeletionCode()
    },
    {
      manual: true,
      onSuccess: () => {
        toast({
          title: t('user.deletion.sentSuccess'),
          message: t('resetPassword.subHeadline', { email: user?.email })
        })
      },
      onError: err => {
        toast({
          title: t('user.deletion.sentFailed'),
          message: err.message
        })
      }
    }
  )

  async function fetch(values: any) {
    await UserService.verifyDeletionCode(values.code)

    // Clear the auth state and logout the user
    setTimeout(() => {
      clearAuthState()
      window.location.href = '/logout'
    }, 1_000)
  }

  useEffect(() => {
    if (isOpen) {
      run()
    }
  }, [isOpen])

  return (
    <Modal.Simple
      open={isOpen}
      title={t('user.deletion.headline')}
      description={t('user.deletion.tip')}
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
          label: t('user.deletion.button')
        }}
        submitOnChangedOnly
        onLoadingChange={set}
      >
        <Form.Item
          name="code"
          label={
            <Trans
              t={t}
              i18nKey="user.deletion.code.label"
              values={{
                email: user?.email
              }}
              components={{
                strong: <strong />
              }}
            />
          }
          rules={[
            {
              required: true,
              message: t('user.deletion.code.required')
            }
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
      </Form.Simple>
    </Modal.Simple>
  )
}
