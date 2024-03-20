import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import { IconCheck, IconSelector, IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC, MouseEvent } from 'react'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { useTransition } from 'react-transition-state'

import { useOnClickOutside } from '../hook'
import Input from '../input/Input'
import Popup from '../popup'
import Spin from '../spin'
import { IComponentProps, IOptionType } from '../typing'
import { stopEvent, stopPropagation } from '../utils'
import type { SelectProps } from './Native'
import { flattenOptions } from './utils'

interface CustomOptionProps extends Pick<SelectProps, 'labelKey' | 'optionRender'> {
  option: IOptionType
  isActive?: boolean
  onClick: (option: IOptionType) => void
}

export const CustomSelectOption: FC<CustomOptionProps> = ({
  option,
  labelKey = 'label',
  isActive,
  optionRender,
  onClick
}) => {
  function handleClick() {
    onClick(option)
  }

  return (
    <li
      className={clsx('select-option', {
        'select-option-active': isActive,
        'select-option-disabled': option.disabled
      })}
      onClick={handleClick}
    >
      {optionRender ? (
        optionRender(option, isActive)
      ) : (
        <div className="select-option-container">
          <span className="select-option-text">{option[labelKey]}</span>
          {isActive && (
            <span className="select-option-checkmark">
              <IconCheck />
            </span>
          )}
        </div>
      )}
    </li>
  )
}

interface NativeLikeMenuProps extends IComponentProps {
  visible?: boolean
  duration?: number
  onExited?: () => void
}

const NativeLikeMenu: FC<NativeLikeMenuProps> = ({
  visible = false,
  duration = 100,
  children,
  onExited,
  ...restProps
}) => {
  function handleStateChange({ state }: any) {
    if (state === 'exited') {
      onExited?.()
    }
  }

  const [state, toggle] = useTransition({
    timeout: duration,
    initialEntered: visible,
    preEnter: true,
    preExit: true,
    unmountOnExit: false,
    onChange: handleStateChange
  })

  useEffect(() => {
    toggle(visible)
  }, [visible])

  return (
    <div className={clsx('popup', `popup-transition-${state}`)} {...restProps}>
      {children}
    </div>
  )
}

const Custom: FC<SelectProps> = ({
  className,
  popupClassName,
  nativeLike,
  allowInput,
  alwaysInput,
  inputHTMLType = 'text',
  allowClear = false,
  placement = 'bottom-start',
  options: rawOptions = [],
  labelKey = 'label',
  valueKey = 'value',
  value,
  isHasError,
  loading,
  disabled,
  valueRender,
  placeholder,
  optionRender,
  onDropdownVisibleChange,
  onChange,
  ...restProps
}) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [listRef, setListRef] = useState<HTMLUListElement | null>(null)
  const popperOptions: Partial<PopperOptions> = {
    placement,
    strategy: 'fixed',
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          gpuAcceleration: false
        }
      }
    ]
  }

  const [inputValue, setInputValue] = useState<string>(alwaysInput ? (value as string) : '')
  const options = useMemo(
    () => flattenOptions(rawOptions, allowInput ? undefined : inputValue, labelKey as string),
    [rawOptions, allowInput, inputValue, labelKey]
  )

  const [selected, setSelected] = useState<IOptionType>()
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [width, setWidth] = useState<number>()

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    stopEvent(event)

    if (loading || disabled) {
      return
    }

    if (nativeLike) {
      setIsOpen(!isOpen)
    } else {
      setIsOpen(true)
    }
  }

  function handleExited() {
    setIsOpen(false)
    setIsFocused(false)

    if (!alwaysInput) {
      setInputValue('')
    }
  }

  function handleOptionClick(option: IOptionType) {
    handleExited()
    onChange?.(option[valueKey])
  }

  function handleInputFocus() {
    if (allowInput) {
      setIsFocused(true)
    }
  }

  function handleInputBlur() {
    if (allowInput) {
      setIsFocused(false)
    }
  }

  function handleInputClick(event: any) {
    if (allowInput && !allowInput) {
      stopPropagation(event)
    }
  }

  function handleInputChange(newInputValue: any) {
    startTransition(() => {
      setInputValue(newInputValue)

      if (allowInput) {
        onChange?.(newInputValue)
      }
    })
  }

  function handleClear(event: any) {
    stopPropagation(event)
    handleExited()
    onChange?.(undefined as unknown as any)
  }

  const handleExitedCallback = useCallback(handleExited, [])

  const memoOverlay = useMemo(() => {
    return (
      <ul
        ref={setListRef}
        className={clsx('select-popup-content', popupClassName)}
        style={{ width }}
        onClick={stopPropagation}
      >
        {options.map((option: any) => {
          const key = option[valueKey] as string

          return option.isGroup ? (
            <div key={key} className="select-group-label">
              {option[labelKey]}
            </div>
          ) : (
            <CustomSelectOption
              key={key}
              option={option}
              labelKey={labelKey}
              optionRender={optionRender}
              isActive={option[valueKey] === value}
              onClick={handleOptionClick}
            />
          )
        })}
      </ul>
    )
  }, [options, value, width])

  useOnClickOutside(ref as HTMLElement, () => {
    if (nativeLike && isOpen) {
      handleExited()
    }
  })

  useEffect(() => {
    if (isOpen) {
      setWidth(ref?.getBoundingClientRect().width)
    }

    onDropdownVisibleChange?.(isOpen)
  }, [isOpen])

  useEffect(() => {
    if (allowInput) {
      if (value !== inputValue) {
        setInputValue(value as string)
      }
    } else {
      const option = options.find((row: any) => row[valueKey] === value)
      setSelected(option)
    }
  }, [value])

  useEffect(() => {
    if (listRef) {
      const activeElement = listRef.querySelector('.select-option-active')

      if (activeElement) {
        activeElement.scrollIntoView()
      }
    }
  }, [listRef])

  return (
    <>
      <div
        ref={setRef}
        className={clsx(
          'select',
          {
            'select-error': isHasError,
            'select-native-like': nativeLike,
            'select-open': isFocused || isOpen,
            'select-disabled': loading || disabled,
            'select-selected': !!selected
          },
          className
        )}
        tabIndex={0}
        onClick={handleClick}
      >
        <div className="select-button" role="button">
          {selected ? (
            <>
              <div className="select-value">
                {valueRender ? valueRender(selected) : selected[labelKey]}
              </div>
              {allowClear ? (
                <div className="select-clear-button select-arrow-icon" onClick={handleClear}>
                  <IconX />
                </div>
              ) : (
                <div className="select-arrow-icon">{loading ? <Spin /> : <IconSelector />}</div>
              )}
            </>
          ) : (
            <>
              <Input
                type={inputHTMLType}
                placeholder={placeholder}
                value={inputValue}
                disabled={loading || disabled}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleInputClick}
                onChange={handleInputChange}
                {...(restProps as any)}
              />
              <div className="select-arrow-icon">{loading ? <Spin /> : <IconSelector />}</div>
            </>
          )}
        </div>

        {nativeLike && (
          <NativeLikeMenu visible={isOpen} onExited={handleExitedCallback}>
            {memoOverlay}
          </NativeLikeMenu>
        )}
      </div>

      {!nativeLike && (
        <Popup
          visible={isOpen}
          referenceRef={ref as Element}
          popperOptions={popperOptions}
          onExited={handleExitedCallback}
        >
          {memoOverlay}
        </Popup>
      )}
    </>
  )
}

export default Custom
