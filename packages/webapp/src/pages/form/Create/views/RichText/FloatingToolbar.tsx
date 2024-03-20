import { helper } from '@heyform-inc/utils'
import type { CSSProperties, FC } from 'react'
import { startTransition, useEffect, useState } from 'react'

import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon, UnlinkIcon } from '@/components'
import { Button, Form, Input, Portal } from '@/components/ui'

import { getRangeSelection, getStyleFromRect } from './utils'

interface FloatingToolbarProps extends Omit<IComponentProps, 'onChange'>, IModalProps {
  range?: Range
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

  // function handleLink({ url }: any) {
  //   const sel = getRangeSelection(range!)
  //   const node = document.createElement('a')

  //   node.setAttribute('href', url)
  //   node.setAttribute('target', '_blank')
  //   node.innerText = sel!.toString()

  //   range!.deleteContents()
  //   range!.insertNode(node)

  //   onChange()
  // }

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

    return () => {
      setActiveState({} as ActiveState)
    }
  }, [visible])

  return (
    <Portal visible={visible}>
      <div className="floating-toolbar">
        <div className="floating-toolbar-mask" onClick={onClose} />
        <div
          className="floating-toolbar-container flex items-center rounded-md bg-white px-1 py-0.5 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={portalStyle}
          {...restProps}
        >
          {linkBubbleVisible ? (
            <Form.Custom
              inline
              initialValues={{
                url: activeState.link
              }}
              submitText="Apply"
              submitOptions={{
                className: 'ml-1 my-1',
                type: 'primary'
              }}
              onlySubmitOnValueChange={true}
              request={handleLink}
            >
              <Form.Item name="url" rules={[{ required: true }]}>
                <Input className="mb-1" placeholder="Paste or enter link here" />
              </Form.Item>
            </Form.Custom>
          ) : (
            <>
              <Button.Link leading={<BoldIcon className="text-slate-700" />} onClick={handleBold} />
              <Button.Link
                leading={<ItalicIcon className="text-slate-700" />}
                onClick={handleItalic}
              />
              <Button.Link
                leading={<UnderlineIcon className="text-slate-700" />}
                onClick={handleUnderline}
              />
              <Button.Link
                leading={<LinkIcon className="text-slate-700" />}
                onClick={handleLinkOpen}
              />
              {activeState.link && (
                <Button.Link
                  leading={<UnlinkIcon className="text-slate-700" />}
                  onClick={handleUnlink}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
