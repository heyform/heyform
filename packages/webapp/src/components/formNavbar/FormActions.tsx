import { FormModel } from '@heyform-inc/shared-types-enums'
import { IconEye, IconSend2, IconShare } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, notification } from '@/components/ui'
import { FormService } from '@/service'
import { useStore } from '@/store'

export const FormActions = observer(() => {
  const { t } = useTranslation()

  const appStore = useStore('appStore')
  const formStore = useStore('formStore')
  const [loading, setLoading] = useState(false)

  function handlePreview() {
    appStore.isFormPreviewOpen = true
  }

  function handleShare() {
    appStore.isFormShareModalOpen = true
  }

  async function handlePublish() {
    if (loading) {
      return
    }
    setLoading(true)

    try {
      await FormService.update(formStore.current!.id, {
        active: true
      })

      formStore.updateSettings({
        active: true
      })
      appStore.isFormShareModalOpen = true
    } catch (err: any) {
      notification.error({
        title: 'Failed to publish form'
      })
    }

    setLoading(false)
  }

  const actions = useMemo(
    () => [
      {
        label: t('form.preview'),
        icon: IconEye,
        onClick: handlePreview
      },
      {
        label: t('form.share'),
        icon: IconShare,
        onClick: handleShare
      },
      {
        label: formStore.current?.settings?.active ? t('form.published') : t('form.publish'),
        icon: IconSend2,
        disabled: formStore.current?.settings?.active,
        onClick: handlePublish
      }
    ],
    [formStore, handlePreview, handlePublish, handleShare, t]
  )

  return (
    <div className="flex flex-col items-center gap-2.5 md:mr-3 md:flex-row md:gap-1">
      {actions.map((action, index) => (
        <Button.Link
          key={index}
          className="!flex w-full items-center !justify-start gap-3 !px-0 !py-1 !text-sm md:w-auto md:flex-col md:!justify-center md:gap-0 md:!px-1.5 md:!text-xs"
          leading={<action.icon className="-mr-1.5 text-slate-900 md:mb-1" />}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button.Link>
      ))}
    </div>
  )
})
