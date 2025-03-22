import { useBoolean, useRequest } from 'ahooks'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Input, Modal, useToast } from '@/components'
import { WorkspaceService } from '@/services'
import { useModal, useUserStore, useWorkspaceStore } from '@/store'
import { useRouter } from '@/utils'

export default function WorkspaceDeletionModal() {
  const { t } = useTranslation()

  const toast = useToast()
  const router = useRouter()

  const { user } = useUserStore()
  const { deleteWorkspace } = useWorkspaceStore()

  const { isOpen, payload, onOpenChange } = useModal('WorkspaceDeletionModal')
  const [loading, { set }] = useBoolean(false)

  const { run } = useRequest(
    async () => {
      await WorkspaceService.dissolveCode(payload.id)
    },
    {
      manual: true,
      refreshDeps: [payload?.id],
      onSuccess: () => {
        toast({
          title: t('settings.deletion.sentSuccess'),
          message: t('resetPassword.subHeadline', { email: user?.email })
        })
      },
      onError: err => {
        toast({
          title: t('settings.deletion.sentFailed'),
          message: err.message
        })
      }
    }
  )

  async function fetch(values: any) {
    await WorkspaceService.dissolve(payload.id, values.code)

    deleteWorkspace(payload.id)
    router.replace('/')
  }

  useEffect(() => {
    if (payload) {
      run()
    }
  }, [payload])

  return (
    <Modal.Simple
      open={isOpen}
      title={t('settings.deletion.headline')}
      description={
        <div className="space-y-2.5 text-sm text-secondary">
          <p>
            <Trans
              t={t}
              i18nKey="settings.deletion.tip1"
              values={{
                name: payload?.name
              }}
              components={{
                strong: <strong className="text-primary" />
              }}
            />
          </p>
          <p>{t('settings.deletion.tip2')}</p>
          <p>{t('settings.deletion.tip3')}</p>
        </div>
      }
      contentProps={{
        className: 'max-w-md'
      }}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <Form.Simple
        className="space-y-4"
        fetch={fetch}
        refreshDeps={[payload?.id]}
        submitProps={{
          className: 'px-5 w-full bg-error text-primary-light dark:text-primary hover:bg-error',
          size: 'md',
          label: t('settings.deletion.button')
        }}
        submitOnChangedOnly
        onLoadingChange={set}
      >
        <Form.Item
          name="code"
          label={
            <Trans
              t={t}
              i18nKey="settings.deletion.code.label"
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
              message: t('settings.deletion.code.required')
            }
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
      </Form.Simple>
    </Modal.Simple>
  )
}
