import type { ClipboardEvent, FC, KeyboardEvent } from 'react'
import { startTransition, useCallback, useEffect, useRef, useState } from 'react'

import { preventDefault, stopPropagation } from '@/components'

import { useTranslation } from '../utils'

interface TextareaProps {
  disabled?: boolean
  value?: any
  placeholder?: string
  onChange?: (value?: any) => void
}

export const Textarea: FC<TextareaProps> = ({
  value: rawValue,
  disabled,
  onChange,
  ...restProps
}) => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [value] = useState(rawValue)
  const [isCompositing, setIsCompositing] = useState(false)
  const [isTipShow, setTipShow] = useState(true)

  function handleUpdate() {
    startTransition(() => {
      onChange?.(ref.current?.innerText)
    })
  }

  function handleComposition(event: any) {
    switch (event.type) {
      case 'compositionstart':
        setIsCompositing(true)
        break

      case 'compositionend':
        setIsCompositing(false)
        handleUpdate()
        break
    }
  }

  function handlePaste(event: ClipboardEvent) {
    preventDefault(event)

    const text = event.clipboardData!.getData('text/plain')
    document.execCommand('insertText', false, text)

    handleUpdate()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') {
      preventDefault(event)

      if (e.shiftKey || window.heyform.device.mobile) {
        stopPropagation(event)
        document.execCommand('insertText', false, '\n')
      }
    }
  }

  const handleUpdateCallback = useCallback(handleUpdate, [])
  const handleCompositionCallback = useCallback(handleComposition, [isCompositing])
  const handleKeyDownCallback = useCallback(handleKeyDown, [])
  const handlePasteCallback = useCallback(handlePaste, [])

  useEffect(() => {
    if (ref.current && value) {
      ref.current.innerText = value
    }
  }, [value])

  useEffect(() => {
    if (window.heyform.device.mobile) {
      setTipShow(false)
    }
  }, [])

  return (
    <>
      <div
        ref={ref}
        contentEditable={true}
        suppressContentEditableWarning={true}
        className="heyform-textarea"
        placeholder={t('Your answer goes here')}
        onCompositionStart={handleCompositionCallback}
        onCompositionEnd={handleCompositionCallback}
        onInput={handleUpdateCallback}
        onKeyDown={handleKeyDownCallback}
        onPaste={handlePasteCallback}
        {...restProps}
      />
      {isTipShow && (
        <div className="heyform-textarea-tip">{t('Hit Shift ⇧ + Enter ↵ for new line')}</div>
      )}
    </>
  )
}
