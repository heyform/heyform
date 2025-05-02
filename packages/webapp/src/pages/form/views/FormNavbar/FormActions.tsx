// import { FormModel } from '@heyform-inc/shared-types-enums'
import { IconEye, IconSend2, IconShare } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button // notification
} from '@/components'
import { FormService } from '@/services'
import { useAppStore, useFormStore } from '@/store'

// import { useStore } from '@/store'

export const FormActions = observer(() => {
  const { t } = useTranslation()

  const appStore = useAppStore()
  const formStore = useFormStore()
  const [loading, setLoading] = useState(false)

  function handlePreview() {
    appStore.openModal('isFormPreviewOpen')
  }

  function handleShare() {
    appStore.openModal('isFormShareModalOpen')
  }

  async function handlePublish() {
    if (loading) {
      return
    }
    setLoading(true)

    try {
      await FormService.update(formStore.form!.id, {
        active: true
      })

      formStore.updateSettings({
        active: true
      })
      appStore.openModal('isFormShareModalOpen')
    } catch (err: any) {
      // notification.error({
      //   title: 'Failed to publish form'
      // })
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
        label: formStore.form?.settings?.active ? t('form.published') : t('form.publish'),
        icon: IconSend2,
        disabled: formStore.form?.settings?.active,
        onClick: handlePublish
      }
    ],
    // [formStore, handlePreview, handlePublish, handleShare, t]
    [t]
  )

  return (
    <div className="flex flex-col items-center gap-2.5 md:mr-3 md:flex-row md:gap-1">
      {actions.map((action, index) => (
        <Button
          variant="link"
          key={index}
          className="!flex w-full items-center !justify-start gap-3 !px-0 !py-1 !text-sm md:w-auto md:flex-col md:!justify-center md:gap-0 md:!px-1.5 md:!text-xs"
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
})
