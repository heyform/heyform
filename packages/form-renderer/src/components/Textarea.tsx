import clsx from 'clsx'
import type { ClipboardEvent, FC, KeyboardEvent, ChangeEvent, CompositionEvent, Ref } from 'react'
import { startTransition, useCallback, useEffect, useRef, useState, useImperativeHandle } from 'react'

import { IComponentProps } from '../typings'
import { InputRef } from './Input'

import { preventDefault, stopPropagation, useTranslation } from '../utils'

interface TextareaProps {
  disabled?: boolean
  value?: any
  placeholder?: string
  onChange?: (value?: any) => void
}

interface AutoResizeTextareaProps extends Omit<IComponentProps, 'onKeyDown'> {
  ref?: Ref<InputRef>
  disabled?: boolean
  autoFocus?: boolean
  value?: any
  placeholder?: string
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>, isCompositionStart: boolean) => void
  onChange?: (value?: any) => void
}

export const Textarea: FC<TextareaProps> = ({ value: rawValue, onChange, ...restProps }) => {
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
        data-placeholder={t('Your answer goes here')}
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

export const AutoResizeTextarea: FC<AutoResizeTextareaProps> = ({
  ref,
  value: rawValue = '',
  disabled,
  autoFocus,
  onKeyDown,
  onChange,
  ...restProps
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lockRef = useRef(false)

  const [value, setValue] = useState(rawValue)

  function getValue(event: any) {
    return event.target.value
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const newValue = getValue(event)

    setValue(newValue)

    if (!lockRef.current) {
      onChange?.(newValue)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event, lockRef.current)
  }

  function handleCompositionStart() {
    lockRef.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    lockRef.current = false
    onChange?.(getValue(event))
  }

  useImperativeHandle<InputRef, InputRef>(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus()
      },
      blur() {
        inputRef.current?.blur()
      }
    }),
    []
  )

  useEffect(() => {
    if (rawValue !== value) {
      lockRef.current = false
      setValue(rawValue)
    }
  }, [rawValue])

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus()
    }
  }, [inputRef])

  return (
    <textarea
      ref={inputRef}
      className={clsx("heyform-autoresize-textarea", {
        'heyform-autoresize-invalid': !window.CSS.supports('field-sizing', 'content')
      })}
      value={value as string}
      disabled={disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      {...restProps}
    />
  )
}
