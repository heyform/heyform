import { FormRenderer } from '@heyform-inc/form-renderer'
import { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal, Tabs } from '@/components'
import { useFormStore, useModal } from '@/store'
import { cn } from '@/utils'

interface PreviewComponentProps {
  onClose: () => void
}

const PreviewComponent: FC<PreviewComponentProps> = () => {
  const { t } = useTranslation()

  const { form: rawForm } = useFormStore()
  const [platform, setPlatform] = useState('mobile')

  const form: any = useMemo(
    () => ({
      ...rawForm,
      fields: rawForm?.drafts || [],
      settings: {
        ...rawForm?.settings,
        whitelabelBranding: true
      }
    }),
    [rawForm]
  )

  const tabs = useMemo(
    () => [
      {
        value: 'desktop',
        label: t('form.builder.preview.desktop')
      },
      {
        value: 'mobile',
        label: t('form.builder.preview.mobile')
      }
    ],
    [t]
  )

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden px-2 pb-2">
      <div className="flex h-14 items-center justify-center">
        <Tabs.SegmentedControl
          className="hidden sm:flex [&_[data-slot=nav]]:h-9 [&_[data-slot=tablist]_button]:py-0.5"
          tabs={tabs}
          defaultTab={platform}
          onChange={setPlatform}
        />
      </div>

      <div className="h-[calc(100vh-4rem)] bg-foreground lg:rounded-lg lg:shadow-sm lg:ring-1 lg:ring-primary/5">
        <div className={cn('form-preview relative h-full w-full', `form-preview-${platform}`)}>
          <FormRenderer
            form={form}
            autoSave={false}
            query={{}}
            locale={form?.settings?.locale || 'en'}
            alwaysShowNextButton={true}
            enableQuestionList={form?.settings?.enableQuestionList}
            enableNavigationArrows={form?.settings?.enableNavigationArrows}
          />
        </div>
      </div>
    </div>
  )
}

export default function PreviewModal() {
  const { isOpen, onOpenChange } = useModal('PreviewModal')

  return (
    <Modal
      open={isOpen}
      overlayProps={{
        className: 'bg-transparent'
      }}
      contentProps={{
        className:
          'max-w-screen max-h-screen !overflow-hidden w-screen h-screen bg-foreground p-0 bg-background focus:outline-none focus-visible:outline-none'
      }}
      onOpenChange={onOpenChange}
    >
      <PreviewComponent onClose={() => onOpenChange(false)} />
    </Modal>
  )
}
