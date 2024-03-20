import type { FormField, Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { CSSProperties, ClipboardEvent, FC, KeyboardEvent, RefObject } from 'react'
import { startTransition, useCallback, useEffect, useState } from 'react'

import { FloatingToolbar } from './FloatingToolbar'
import { MentionMenu } from './MentionMenu'
import type { RichTextTriggerSelection } from './utils'
import {
  getStyleFromRect,
  getTextPrecedingAtTrigger,
  getTriggerSelection,
  insertClipboardHTML,
  replaceTriggerText
} from './utils'

interface RichTextProps extends Omit<IComponentProps, 'onChange'> {
  innerRef: RefObject<HTMLDivElement>
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
}

const MENTION_TRIGGER = '@'

export const RichText: FC<RichTextProps> = ({
  className,
  innerRef,
  value,
  placeholder,
  onFocus,
  onChange,
  ...restProps
}) => {
  const [keyword, setKeyword] = useState<string>()
  const [inputKey, setInputKey] = useState<string>()
  const [isCompositing, setIsCompositing] = useState(false)
  const [isMentionOpen, setIsMentionOpen] = useState(false)
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({})
  const [triggerSelection, setTriggerSelection] = useState<RichTextTriggerSelection>()
  const [toolbarRange, setToolbarRange] = useState<Range>()

  function handleUpdate() {
    startTransition(() => {
      onChange?.(innerRef.current!.innerHTML)
    })
  }

  const handleUpdateCallback = useCallback(handleUpdate, [])

  function handleComposition(event: any) {
    switch (event.type) {
      case 'compositionstart':
        setIsCompositing(true)
        break

      case 'compositionend':
        setIsCompositing(false)
        handleUpdateCallback()
        break
    }
  }

  function handlePaste(event: ClipboardEvent) {
    event.preventDefault()

    if (!isToolbarOpen) {
      insertClipboardHTML(event)
      handleUpdateCallback()
    }
  }

  function hideToolbar() {
    setIsToolbarOpen(false)
    setToolbarRange(undefined)
  }

  function hideMentionMenu() {
    setKeyword(undefined)
    setIsMentionOpen(false)
  }

  function handleMentionSelect(type: string, option: Partial<FormField> | Variable) {
    const ts = triggerSelection!
    const sel: RichTextTriggerSelection = {
      anchorNode: ts.anchorNode,
      startOffset: ts.startOffset! - 1,
      endOffset: ts.startOffset! + (keyword?.length || 0)
    }
    let template = ''

    if (type === 'variable') {
      template = `<span class="variable" data-variable="${option.id}" contenteditable="false">@${
        (option as Variable).name
      }</span>\xA0`
    } else if (type === 'mention') {
      template = `<span class="mention" data-mention="${option.id}" contenteditable="false">@${
        (option as FormField).title
      }</span>\xA0`
    }

    replaceTriggerText(innerRef.current!, sel, template)

    handleUpdateCallback()
    hideMentionMenu()
  }

  function handleMouseUp() {
    const sel = window.getSelection()

    if (sel) {
      const text = sel.toString()

      if (helper.isValid(text)) {
        setToolbarRange(sel!.getRangeAt(0).cloneRange())
        setIsToolbarOpen(true)
      } else {
        setToolbarRange(undefined)
        setIsToolbarOpen(false)
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isCompositing) {
      return
    }

    // Save pressed key
    setInputKey(event.key)
  }

  function handleKeyUp() {
    if (isCompositing) {
      return
    }

    if (!isMentionOpen) {
      if (inputKey === MENTION_TRIGGER) {
        const selection = getTriggerSelection()

        setPortalStyle(getStyleFromRect(selection!.rect!))
        setIsMentionOpen(true)
        setTriggerSelection(selection)
      }

      handleMouseUp()
    }
  }

  function handleInput() {
    if (isMentionOpen) {
      const { startOffset } = triggerSelection!
      const preceding = getTextPrecedingAtTrigger(MENTION_TRIGGER, startOffset)

      if (preceding.isTriggering) {
        setKeyword(preceding.text)
      } else {
        hideMentionMenu()
      }
    } else {
      if (isCompositing) {
        return
      }

      if (isToolbarOpen) {
        if (helper.isEmpty(innerRef.current!.innerHTML)) {
          hideToolbar()
        }
      }
    }

    handleUpdateCallback()
  }

  const handleCompositionCallback = useCallback(handleComposition, [])
  const handleKeyDownCallback = useCallback(handleKeyDown, [isCompositing])
  const handleKeyUpCallback = useCallback(handleKeyUp, [
    isCompositing,
    isMentionOpen,
    isToolbarOpen,
    inputKey,
    triggerSelection
  ])
  const handleInputCallback = useCallback(handleInput, [
    isCompositing,
    isMentionOpen,
    isToolbarOpen,
    triggerSelection
  ])
  const handlePasteCallback = useCallback(handlePaste, [isToolbarOpen])
  const handleMouseUpCallback = useCallback(handleMouseUp, [])
  const hideMentionMenuCallback = useCallback(hideMentionMenu, [])
  const handleMentionSelectCallback = useCallback(handleMentionSelect, [keyword, triggerSelection])
  const hideToolbarCallback = useCallback(hideToolbar, [])

  // Setup initial html
  useEffect(() => {
    if (innerRef.current && helper.isValid(value)) {
      innerRef.current.innerHTML = value!
    }
  }, [innerRef])

  return (
    <>
      <div
        ref={innerRef}
        className={clsx('rich-text', className)}
        placeholder={placeholder}
        contentEditable={true}
        suppressContentEditableWarning={true}
        tabIndex={0}
        onCompositionStart={handleCompositionCallback}
        onCompositionEnd={handleCompositionCallback}
        onKeyDown={handleKeyDownCallback}
        onKeyUp={handleKeyUpCallback}
        onInput={handleInputCallback}
        onPaste={handlePasteCallback}
        onMouseUp={handleMouseUpCallback}
        {...restProps}
      />

      <MentionMenu
        visible={isMentionOpen}
        keyword={keyword}
        portalStyle={portalStyle}
        onClose={hideMentionMenuCallback}
        onComplete={handleMentionSelectCallback}
      />

      <FloatingToolbar
        visible={isToolbarOpen}
        range={toolbarRange}
        onClose={hideToolbarCallback}
        onChange={console.log}
      />
    </>
  )
}
