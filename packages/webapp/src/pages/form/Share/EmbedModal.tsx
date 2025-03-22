import { helper } from '@heyform-inc/utils'
import { IconCode } from '@tabler/icons-react'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, ColorPicker, Input, Modal, Select, Switch } from '@/components'
import { FORM_EMBED_OPTIONS } from '@/consts'
import { useAppStore, useFormStore, useModal, useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

const SIZE_OPTIONS = [
  {
    label: 'px',
    value: 'px',
    min: 100
  },
  {
    label: '%',
    value: '%',
    min: 1,
    max: 100
  }
]

const MODAL_SIZE_OPTIONS = [
  { value: 'small', label: 'form.share.embed.small' },
  { value: 'medium', label: 'form.share.embed.medium' },
  { value: 'large', label: 'form.share.embed.large' }
]

const MODAL_LAUNCH_OPTIONS = [
  { value: 'click', label: 'form.share.embed.click' },
  { value: 'load', label: 'form.share.embed.load' },
  { value: 'delay', label: 'form.share.embed.delay' },
  { value: 'exit', label: 'form.share.embed.exit' },
  { value: 'scroll', label: 'form.share.embed.scroll' }
]

const POPUP_POSITION_OPTIONS = [
  { value: 'bottom-left', label: 'form.share.embed.bottomLeft' },
  { value: 'bottom-right', label: 'form.share.embed.bottomRight' }
]

const FRAME_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>body{margin:40px;}.container{max-width:1180px;margin-left:auto;margin-right:auto;}.mt-10{margin-top:40px;}.hf{background:rgba(15,23,42,0.05);border-radius:4px;}.hf-1{width:40%;height:40px;margin-bottom:20px;}.hf-2{width:100%;height:40px;margin-bottom:60px;}.hf-3{width:100%;height:120px;margin-top:60px;margin-bottom:40px;}.flex{display:flex;gap:40px;margin-top:40px;}.hf-4{flex:1 1 auto;height:400px;}.heyform__loading-container{display:none!important;}</style>
</head>
<body>
  <div class="container">
    <div class="hf hf-1"></div>
    <div class="hf hf-2"></div>

    <div class="mt-10">
      {form}
    </div>

    <div class="hf hf-3"></div>
    <div class="hf hf-2"></div>

    <div class="flex">
      <div class="hf hf-4"></div>
      <div class="hf hf-4"></div>
    </div>
  </div>
</body>
</html>
`

const FullpageEmbed: FC<ComponentProps> = ({ children }: ComponentProps) => {
  const { t } = useTranslation()
  const { embedConfig, updateEmbedConfig } = useFormStore()

  return (
    <>
      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm/6">{t('form.share.embed.transparentBackground')}</div>
        <Switch
          value={embedConfig.transparentBackground}
          onChange={transparentBackground =>
            updateEmbedConfig({
              transparentBackground
            })
          }
        />
      </div>
    </>
  )
}

const RESIZE_OPTIONS = [
  {
    label: 'form.share.embed.auto',
    value: 'auto'
  },
  {
    label: 'form.share.embed.fixed',
    value: 'fixed'
  }
]

const StandardEmbed = () => {
  const { t } = useTranslation()
  const { embedConfig, updateEmbedConfig } = useFormStore()

  return (
    <FullpageEmbed>
      <div className="flex items-center justify-between">
        <div className="text-sm/6">{t('form.share.embed.width')}</div>
        <Input.TypeNumber
          className="max-w-40"
          options={SIZE_OPTIONS}
          value={{
            value: embedConfig.width,
            type: embedConfig.widthType
          }}
          onChange={value =>
            updateEmbedConfig({
              width: value.value,
              widthType: value.type
            })
          }
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm/6">{t('form.share.embed.height')}</div>
          <Select
            options={RESIZE_OPTIONS}
            value={embedConfig.autoResizeHeight ? 'auto' : 'fixed'}
            multiLanguage
            onChange={value =>
              updateEmbedConfig({
                autoResizeHeight: value === 'auto'
              })
            }
          />
        </div>

        {!embedConfig.autoResizeHeight && (
          <div className="mt-2 flex justify-end">
            <Input.TypeNumber
              className="max-w-40"
              options={SIZE_OPTIONS}
              value={{
                value: embedConfig.height,
                type: embedConfig.heightType
              }}
              onChange={value =>
                updateEmbedConfig({
                  height: value.value,
                  heightType: value.type
                })
              }
            />
          </div>
        )}
      </div>
    </FullpageEmbed>
  )
}

const ModalEmbed: FC<ComponentProps> = ({ children }) => {
  const { t } = useTranslation()
  const { embedType, embedConfig, updateEmbedConfig } = useFormStore()

  const launchChildren = useMemo(() => {
    switch (embedConfig.openTrigger) {
      case 'delay':
        return (
          <Input
            className="mt-2"
            trailing={t('form.share.embed.secondsDelay')}
            type="number"
            min={0}
            value={embedConfig.openDelay}
            onChange={openDelay => updateEmbedConfig({ openDelay })}
          />
        )

      case 'scroll':
        return (
          <Input
            className="mt-2"
            trailing={t('form.share.embed.pageScrolled')}
            type="number"
            min={0}
            max={100}
            value={embedConfig.openScrollPercent}
            onChange={openScrollPercent => updateEmbedConfig({ openScrollPercent })}
          />
        )

      default:
        return null
    }
  }, [
    embedConfig.openDelay,
    embedConfig.openScrollPercent,
    embedConfig.openTrigger,
    t,
    updateEmbedConfig
  ])

  return (
    <FullpageEmbed>
      {embedType === 'modal' && (
        <div className="space-y-1">
          <div className="text-sm/6">{t('form.share.embed.size')}</div>
          <Select
            className="w-full"
            options={MODAL_SIZE_OPTIONS}
            value={embedConfig.size}
            multiLanguage
            onChange={size => updateEmbedConfig({ size })}
          />
        </div>
      )}

      <div className="space-y-1">
        <div className="space-y-1">
          <div className="text-sm/6">{t('form.share.embed.launch')}</div>
          <Select
            className="w-full"
            options={MODAL_LAUNCH_OPTIONS}
            value={embedConfig.openTrigger}
            multiLanguage
            onChange={openTrigger => updateEmbedConfig({ openTrigger })}
          />
        </div>

        {launchChildren}
      </div>

      {children}

      <div className="flex items-center justify-between">
        <div className="text-sm/6">{t('form.share.embed.triggerBackground')}</div>
        <ColorPicker
          value={embedConfig.triggerBackground}
          contentProps={{
            side: 'right',
            align: 'center'
          }}
          onChange={triggerBackground => updateEmbedConfig({ triggerBackground })}
        />
      </div>

      {embedType === 'modal' && (
        <div className="space-y-1">
          <div className="text-sm/6">{t('form.share.embed.triggerText')}</div>
          <Input
            value={embedConfig.triggerText}
            maxLength={20}
            onChange={triggerText => updateEmbedConfig({ triggerText })}
          />
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-sm/6">{t('form.share.embed.hideAfterSubmit')}</div>
          <Switch
            value={embedConfig.hideAfterSubmit}
            onChange={hideAfterSubmit => updateEmbedConfig({ hideAfterSubmit })}
          />
        </div>

        {helper.isTrue(embedConfig.hideAfterSubmit) && (
          <Input
            type="number"
            min={0}
            trailing={t('form.share.embed.secondsDelay')}
            value={embedConfig.autoClose}
            onChange={autoClose => updateEmbedConfig({ autoClose })}
          />
        )}
      </div>
    </FullpageEmbed>
  )
}

const PopupEmbed = () => {
  const { t } = useTranslation()
  const { embedConfig, updateEmbedConfig } = useFormStore()

  return (
    <ModalEmbed>
      <div className="space-y-1">
        <div className="text-sm/6">{t('form.share.embed.position')}</div>
        <Select
          className="w-full"
          options={POPUP_POSITION_OPTIONS}
          value={embedConfig.position}
          multiLanguage
          onChange={position => updateEmbedConfig({ position })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-sm/6">{t('form.share.embed.width')}</div>
        <Input
          trailing={<span>px</span>}
          type="number"
          min={0}
          value={embedConfig.width}
          onChange={width => updateEmbedConfig({ width })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-sm/6">{t('form.share.embed.height')}</div>
        <Input
          trailing={<span>px</span>}
          type="number"
          min={0}
          value={embedConfig.height}
          onChange={height => updateEmbedConfig({ height })}
        />
      </div>
    </ModalEmbed>
  )
}

const EmbedComponent = () => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { openModal, closeModal } = useAppStore()
  const { embedType, embedConfig, selectEmbedType } = useFormStore()
  const { sharingURLPrefix } = useWorkspaceStore()

  const sidebar = useMemo(() => {
    switch (embedType) {
      case 'modal':
        return <ModalEmbed />

      case 'popup':
        return <PopupEmbed />

      case 'fullpage':
        return <FullpageEmbed />

      default:
        return <StandardEmbed />
    }
  }, [embedType])

  const code = useMemo(() => {
    const attributes: string[] = Object.keys(embedConfig).reduce((prev, key) => {
      const name = 'data-heyform-' + key.replace(/[A-Z]/g, w => `-${w.toLowerCase()}`)

      return [...prev, `${name}="${embedConfig[key]}"`]
    }, [] as string[])

    return `<div
\tdata-heyform-id="${formId}"
\tdata-heyform-type="${embedType}"
\tdata-heyform-custom-url="${sharingURLPrefix}/f/${formId}"
\t${attributes.join('\n\t')}
>
  ${embedType === 'modal' ? `<button class="heyform__trigger-button" type="button" onclick="HeyForm.openModal('${formId}Modal')">${embedConfig.triggerText}</button>` : ''}
</div>
<script src="https://www.unpkg.com/@heyform-inc/embed@latest/dist/index.umd.js"></script>
`
  }, [embedConfig, embedType, formId, sharingURLPrefix])

  const content = useMemo(() => FRAME_CONTENT.replace('{form}', code), [code])

  return (
    <div className="flex h-full">
      <div className="scrollbar h-full w-full border-r border-accent-light px-4 py-6 sm:w-80">
        <div className="flex items-center justify-between">
          <h2 className="text-base/6 font-semibold">{t('form.share.embed.title')}</h2>

          <Button.Link
            className="!p-0 text-secondary hover:bg-transparent hover:text-primary"
            size="sm"
            onClick={() => closeModal('EmbedModal')}
          >
            {t('components.close')}
          </Button.Link>
        </div>

        <div className="mt-4 space-y-2.5">
          <Select
            className="w-full"
            value={embedType}
            options={FORM_EMBED_OPTIONS as AnyMap[]}
            multiLanguage
            onChange={selectEmbedType}
          />
          <Button
            className="w-full"
            onClick={() => {
              openModal('CodeModal', { code })
            }}
          >
            <IconCode />
            <span>{t('form.share.embed.getCode')}</span>
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-sm/6 font-semibold">{t('form.share.embed.settings')}</h2>
          <div className="mt-2 space-y-4">{sidebar}</div>
        </div>
      </div>

      <div className="h-full flex-1 bg-background">
        <div className="hidden h-full w-full lg:block">
          <iframe className="h-full w-full border-0" srcDoc={content} />
        </div>
      </div>
    </div>
  )
}

function CodeModal() {
  const { t } = useTranslation()
  const { isOpen, payload, onOpenChange } = useModal('CodeModal')

  return (
    <>
      <Modal.Simple
        open={isOpen}
        title={t('form.share.embed.code.headline')}
        description={t('form.share.embed.code.subHeadline')}
        contentProps={{
          className: 'max-w-3xl'
        }}
        onOpenChange={onOpenChange}
      >
        <pre className="my-6 overflow-x-auto rounded bg-primary p-4 text-sm text-foreground">
          <code>{payload?.code}</code>
        </pre>

        <Button.Copy text={payload?.code} />
      </Modal.Simple>
    </>
  )
}

export default function EmbedModal() {
  const { isOpen, onOpenChange } = useModal('EmbedModal')

  return (
    <>
      <Modal
        open={isOpen}
        overlayProps={{
          className: 'bg-transparent'
        }}
        contentProps={{
          className:
            'p-0 w-screen max-w-screen max-h-screen overflow-hidden h-screen bg-foreground focus:outline-none focus-visible:outline-none'
        }}
        isCloseButtonShow={false}
        onOpenChange={onOpenChange}
      >
        <EmbedComponent />
      </Modal>

      <CodeModal />
    </>
  )
}
