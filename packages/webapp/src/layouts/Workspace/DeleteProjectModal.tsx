import { useBoolean, useRequest } from 'ahooks'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Input, Modal, useToast } from '@/components'
import { ProjectService } from '@/services'
import { useModal, useUserStore, useWorkspaceStore } from '@/store'
import { useParam, useRouter } from '@/utils'

export default function DeleteProjectModal() {
  const { t } = useTranslation()

  const toast = useToast()
  const router = useRouter()

  const { workspaceId } = useParam()
  const { user } = useUserStore()
  const { deleteProject } = useWorkspaceStore()

  const { isOpen, payload, onOpenChange } = useModal('DeleteProjectModal')
  const [loading, { set }] = useBoolean(false)

  const { run } = useRequest(
    async () => {
      await ProjectService.deleteCode(payload.id)
    },
    {
      manual: true,
      refreshDeps: [payload?.id],
      onSuccess: () => {
        toast({
          title: t('project.delete.sentSuccess'),
          message: t('resetPassword.subHeadline', { email: user?.email })
        })
      },
      onError: err => {
        toast({
          title: t('project.delete.sentFailed'),
          message: err.message
        })
      }
    }
  )

  async function fetch(values: any) {
    await ProjectService.delete(payload.id, values.code)

    deleteProject(workspaceId, payload.id)
    onOpenChange(false)

    router.replace(`/workspace/${workspaceId}`)
  }

  useEffect(() => {
    if (payload) {
      run()
    }
  }, [payload])

  return (
    <Modal.Simple
      open={isOpen}
      title={t('project.delete.headline')}
      description={
        <div className="space-y-2.5 text-sm text-secondary">
          <p>
            <Trans
              t={t}
              i18nKey="project.delete.tip1"
              values={{
                name: payload?.name
              }}
              components={{
                strong: <strong className="text-primary" />
              }}
            />
          </p>
          <p>{t('project.delete.tip2')}</p>
          <p>{t('project.delete.tip3')}</p>
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
        refreshDeps={[workspaceId, payload?.id]}
        submitProps={{
          className: 'px-5 w-full text-primary-light dark:text-primary bg-error hover:bg-error',
          size: 'md',
          label: t('project.delete.confirm')
        }}
        submitOnChangedOnly
        onLoadingChange={set}
      >
        <Form.Item
          name="code"
          label={
            <Trans
              t={t}
              i18nKey="project.delete.code.label"
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
              message: t('project.delete.code.required')
            }
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
      </Form.Simple>
    </Modal.Simple>
  )
}
