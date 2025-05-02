import { helper } from '@heyform-inc/utils'
import { IconCode, IconX } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton, FullpageIcon, ModalIcon, PopupIcon, StandardIcon } from '@/components'
import { Button, Modal, Select, useLockBodyScroll } from '@/components'
import { HOMEPAGE_URL } from '@/consts'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import { EmbedPreview } from './EmbedPreview'
import { FullpageSettings } from './FullpageSettings'
import { ModalSettings } from './ModalSettings'
import { PopupSettings } from './PopupSettings'
import { StandardSettings } from './StandardSettings'
import './index.scss'

export const FORM_EMBED_OPTIONS = [
  {
    label: 'Standard',
    type: 'standard',
    icon: StandardIcon
  },
  {
    label: 'Modal',
    type: 'modal',
    icon: ModalIcon
  },
  {
    label: 'Popup',
    type: 'popup',
    icon: PopupIcon
  },
  {
    label: 'Full page',
    type: 'fullpage',
    icon: FullpageIcon
  }
]

export const FormEmbedModal: FC = observer(() => {
  const { formId } = useParam()
  const formStore = useStore('formStore')

  const [visible, openModal, closeModal] = useVisible()

	const { t } = useTranslation()

  function handleClose() {
    formStore.resetEmbed()
  }

  function handleTypeChange(newType: any) {
    formStore.embedType = newType
  }

  const code = useMemo(() => {
    if (!formStore.currentEmbedConfig) {
      return ''
    }

    const attributes: string[] = Object.keys(formStore.currentEmbedConfig).reduce((prev, key) => {
      const name = 'data-heyform-' + key.replace(/[A-Z]/g, w => `-${w.toLowerCase()}`)

      return [...prev, `${name}="${formStore.currentEmbedConfig[key]}"`]
    }, [] as string[])

    return `<div
data-heyform-id="${formId}"
data-heyform-type="${formStore.embedType}"
data-heyform-custom-url="${HOMEPAGE_URL}/form/"
${attributes.join('\n')}
>${
      formStore.embedType === 'modal'
        ? `<button class="heyform__trigger-button" type="button" onclick="HeyForm.openModal('${formId}')">${formStore.currentEmbedConfig.triggerText}</button>`
        : ''
    }</div>
<script src="https://www.unpkg.com/@heyform-inc/embed@latest/dist/index.umd.js"></script>`
  }, [formId, formStore.currentEmbedConfig, formStore.embedType])

  const children = useMemo(() => {
    switch (formStore.embedType) {
      case 'modal':
        return <ModalSettings />

      case 'popup':
        return <PopupSettings />

      case 'fullpage':
        return <FullpageSettings />

      default:
        return <StandardSettings />
    }
  }, [formStore.embedType])

  useLockBodyScroll(helper.isValid(formStore.embedType))

  if (helper.isEmpty(formStore.embedType) || !formStore.current) {
    return null
  }

  return (
    <>
      <Modal className="form-embed-modal" visible={true} maskClosable={false} showCloseIcon={false}>
        <div className="form-embed-header">
          <div className="ml-4 text-lg font-medium text-slate-900">{t('share.embed')}</div>
          <Button.Link className="mr-4 p-2" onClick={handleClose}>
            <IconX />
          </Button.Link>
        </div>

        <div className="form-embed-body">
          <div className="scrollbar h-full w-full bg-white px-4 py-6 lg:w-[320px] lg:border-r lg:border-gray-200">
            <div>
              <div className="text-sm font-semibold text-slate-900">{t('formBuilder.type')}</div>
              <Select
                className="mt-4"
                value={formStore.embedType}
                options={FORM_EMBED_OPTIONS as any[]}
                valueKey="type"
                onChange={handleTypeChange}
              />
              <Button
                type="primary"
                className="mt-4 w-full"
                leading={<IconCode />}
                onClick={openModal}
              >
                {t('share.getTheCode')}
              </Button>
            </div>

            <div className="mt-6 text-sm font-semibold text-slate-900">{t('form.settings')}</div>
            <div className="mt-4 space-y-4">{children}</div>
          </div>

          <EmbedPreview code={code} />
        </div>
      </Modal>

      <Modal visible={visible} onClose={closeModal} showCloseIcon>
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('share.addHeyform')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('share.embedCodeText')}
          </p>
        </div>
        <pre className="my-6 overflow-x-auto rounded bg-slate-700 p-4 text-[13px] text-white">
          <code>{code}</code>
        </pre>
        <CopyButton className="!bg-blue-700 !px-6 !py-2.5 !text-white" text={code} />
      </Modal>
    </>
  )
})
