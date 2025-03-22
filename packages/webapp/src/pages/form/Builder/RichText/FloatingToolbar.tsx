import { helper } from '@heyform-inc/utils'
import { IconBold, IconItalic, IconLink, IconUnderline, IconUnlink } from '@tabler/icons-react'
import type { CSSProperties, FC } from 'react'
import { startTransition, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Portal } from '@/components'
import { nextTick } from '@/utils'

import { getStyleFromRect } from './utils'

interface FloatingToolbarProps extends Omit<ComponentProps, 'onChange'> {
  visible?: boolean
  range?: Range
  onClose?: () => void
  onChange: () => void
}

interface ActiveState {
  isBold: boolean
  isItalic: boolean
  isStrikethrough: boolean
  isUnderline: boolean
  link?: string
}

function getActiveState() {
  const state: ActiveState = {
    isBold: document.queryCommandState('bold'),
    isItalic: document.queryCommandState('italic'),
    isStrikethrough: document.queryCommandState('strikethrough'),
    isUnderline: document.queryCommandState('underline'),
    link: undefined
  }

  const sel = window.getSelection()

  if (sel) {
    state.link = sel.anchorNode?.parentElement?.closest('a')?.href
  }

  return state
}

export const FloatingToolbar: FC<FloatingToolbarProps> = ({
  visible,
  range,
  onChange,
  onClose,
  ...restProps
}) => {
  const { t } = useTranslation()

  const [portalStyle, setPortalStyle] = useState<CSSProperties>()
  const [activeState, setActiveState] = useState({} as ActiveState)
  const [linkBubbleVisible, setLinkBubbleVisible] = useState(false)

  function handleBold() {
    document.execCommand('bold')
    onChange()
  }

  function handleItalic() {
    document.execCommand('italic')
    onChange()
  }

  function handleUnderline() {
    document.execCommand('underline')
    onChange()
  }

  function handleLinkOpen() {
    setLinkBubbleVisible(true)
  }

  async function handleLink({ url }: any) {
    setLinkBubbleVisible(false)

    handleSelectRange()
    document.execCommand('createlink', false, url)

    startTransition(() => {
      setActiveState(getActiveState())
      onChange()
    })
  }

  function handleUnlink() {
    document.execCommand('unlink')

    nextTick(() => {
      setActiveState(getActiveState())
    })

    onChange()
  }

  function handleSelectRange() {
    const sel = window.getSelection()
    sel!.removeAllRanges()
    sel!.addRange(range!)

    return sel
  }

  useEffect(() => {
    if (helper.isValid(range) && range instanceof Range) {
      setPortalStyle(getStyleFromRect(range!.getBoundingClientRect()))
    }
  }, [range])

  useEffect(() => {
    if (visible) {
      setActiveState(getActiveState())
    }

    setLinkBubbleVisible(false)

    return () => {
      setActiveState({} as ActiveState)
    }
  }, [visible])

  return (
    <Portal visible={visible}>
      <div className="floating-toolbar">
        <div className="floating-toolbar-mask" onClick={onClose} />
        <div
          className="floating-toolbar-container flex items-center rounded-md bg-foreground px-2 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={portalStyle}
          {...restProps}
        >
          {linkBubbleVisible ? (
            <Form.Simple
              className="flex items-center gap-x-1.5 [&_[data-slot=control]]:space-y-0"
              initialValues={{
                url: activeState.link
              }}
              submitProps={{
                label: t('components.apply'),
                size: 'sm'
              }}
              fetch={handleLink}
              submitOnChangedOnly
            >
              <Form.Item name="url" rules={[{ required: true }]}>
                <Input
                  className="[&_[data-slot=input]]:p-1"
                  placeholder={t('form.builder.compose.pasteLink')}
                />
              </Form.Item>
            </Form.Simple>
          ) : (
            <>
              <Button.Link
                size="sm"
                className="text-secondary hover:text-primary"
                iconOnly
                onClick={handleBold}
              >
                <IconBold className="h-5 w-5" />
              </Button.Link>
              <Button.Link
                size="sm"
                className="text-secondary hover:text-primary"
                iconOnly
                onClick={handleItalic}
              >
                <IconItalic className="h-5 w-5" />
              </Button.Link>
              <Button.Link
                size="sm"
                className="text-secondary hover:text-primary"
                iconOnly
                onClick={handleUnderline}
              >
                <IconUnderline className="h-5 w-5" />
              </Button.Link>
              <Button.Link
                size="sm"
                className="text-secondary hover:text-primary"
                iconOnly
                onClick={handleLinkOpen}
              >
                <IconLink className="h-5 w-5" />
              </Button.Link>
              {activeState.link && (
                <Button.Link
                  size="sm"
                  className="text-secondary hover:text-primary"
                  iconOnly
                  onClick={handleUnlink}
                >
                  <IconUnlink className="h-5 w-5" />
                </Button.Link>
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
