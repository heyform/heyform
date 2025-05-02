import type { ClipboardEvent, FC, KeyboardEvent } from 'react'
import { startTransition, useCallback, useEffect, useRef, useState } from 'react'

import { preventDefault, stopPropagation } from '@/components'

import { useTranslation } from '../utils'

interface TextareaProps {
  value?: any
  placeholder?: string
  onChange?: (value?: any) => void
}

export const Textarea: FC<TextareaProps> = ({ value: rawValue, onChange, ...restProps }) => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [value] = useState(rawValue)
  const [isTipShow, setTipShow] = useState(true)

  const handleUpdate = useCallback(() => {
    startTransition(() => {
      onChange?.(ref.current?.innerText)
    })
  }, [onChange, ref])

  const handleComposition = useCallback(
    (event: any) => {
      switch (event.type) {
        case 'compositionstart': {
          break
        }
        case 'compositionend': {
          handleUpdate()
          break
        }
        default:
          break
      }
    },
    [handleUpdate]
  )

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      preventDefault(event)
      const text = event.clipboardData!.getData('text/plain')
      document.execCommand('insertText', false, text)
      handleUpdate()
    },
    [handleUpdate]
  )

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      preventDefault(event)
      if (e.shiftKey || window.heyform.device.mobile) {
        stopPropagation(event)
        document.execCommand('insertText', false, '\n')
      }
    }
  }, [])

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
        onCompositionStart={handleComposition}
        onCompositionEnd={handleComposition}
        onInput={handleUpdate}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        {...restProps}
      />
      {isTipShow && (
        <div className="heyform-textarea-tip">{t('Hit Shift ⇧ + Enter ↵ for new line')}</div>
      )}
    </>
  )
}
