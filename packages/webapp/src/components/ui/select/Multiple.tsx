import { helper } from '@heyform-inc/utils'
import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import { IconSearch, IconSelector, IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import type { CSSProperties, FC, MouseEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Input from '../input/Input'
import Popup from '../popup'
import Spin from '../spin'
import { IOptionType } from '../typing'
import { stopEvent, stopPropagation } from '../utils'
import { CustomSelectOption } from './Custom'
import type { SelectProps } from './Native'

export interface MultipleSelectProps
  extends Omit<SelectProps, 'value' | 'optionRender' | 'valueRender' | 'onChange'> {
  options: IOptionType[]
  value?: any[]
  placeholder?: string
  allowSearch?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  createOptionLeading?: ReactNode
  createRequest?: (label: string) => Promise<string>
  onChange?: (value: any[]) => void
}

interface MultipleItemProps extends Pick<MultipleSelectProps, 'labelKey'> {
  option: IOptionType
  onRemove: (option: IOptionType) => void
}

const MultipleItem: FC<MultipleItemProps> = ({ option, labelKey = 'label', onRemove }) => {
  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    stopPropagation(event)
    onRemove(option)
  }

  return (
    <span className="multiple-item">
      <span className="multiple-item-label">{option[labelKey]}</span>
      <span className="multiple-item-remove" onClick={handleClick}>
        <IconX />
      </span>
    </span>
  )
}

const Multiple: FC<MultipleSelectProps> = ({
  className,
  options: rawOptions = [],
  labelKey = 'label',
  valueKey = 'value',
  value = [],
  placeholder,
  allowSearch = true,
  searchPlaceholder,
  isHasError,
  loading,
  disabled,
  createOptionLeading,
  createRequest,
  onChange,
  ...restProps
}) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [triggerStyle, setTriggerStyle] = useState<CSSProperties>()
  const popperOptions: Partial<PopperOptions> = useMemo(() => {
    return {
      placement: 'bottom-start',
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
  }, [])

  const [keyword, setKeyword] = useState<string | null>(null)
  const [options, setOptions] = useState<IOptionType[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isNewOption, setIsNewOption] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const selected = useMemo(() => {
    if (helper.isValidArray(value)) {
      return value!
        .map(row => rawOptions.find(o => o[valueKey] === row))
        .filter(Boolean) as IOptionType[]
    }
    return []
  }, [value, rawOptions])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    stopEvent(event)
    setIsOpen(true)
  }

  function handleExited() {
    setIsOpen(false)
  }

  function handleKeywordChange(inputValue?: any) {
    setKeyword(inputValue as string)
  }

  function handleOptionClick(option: IOptionType) {
    if (option.disabled) {
      return
    }

    const currValue = option[valueKey] as any
    const newValue = value?.includes(currValue)
      ? value?.filter(v => v !== currValue)
      : [...value, currValue]

    onChange?.(newValue)
  }

  function handleRemove(option: IOptionType) {
    const currValue = option[valueKey] as any
    onChange?.(value?.filter(v => v !== currValue))
  }

  async function handleCreate() {
    if (!createRequest) {
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const val = await createRequest(keyword as string)

      setKeyword(null)
      handleOptionClick({ [valueKey]: val } as IOptionType)
    } catch (err: any) {
      setError(err)
    }

    setIsCreating(false)
  }

  const handleExitedCallback = useCallback(handleExited, [])

  const memoOverlay = useMemo(() => {
    return (
      <div className="select-popup-content" onClick={stopPropagation}>
        {allowSearch && (
          <Input
            className="multiple-search"
            leading={<IconSearch />}
            placeholder={searchPlaceholder}
            onChange={handleKeywordChange}
          />
        )}
        <ul style={{ width: triggerStyle?.width }}>
          {options.map(option => {
            const key = option[valueKey] as any

            return (
              <CustomSelectOption
                key={key}
                option={option}
                labelKey={labelKey}
                isActive={value?.includes(key)}
                onClick={handleOptionClick}
              />
            )
          })}
        </ul>
        {isNewOption && (
          <div className="multiple-create-option" onClick={handleCreate}>
            <div className="multiple-create-content">
              {createOptionLeading}
              <span className="multiple-create-keyword">{keyword}</span>
            </div>
            {isCreating && <Spin />}
          </div>
        )}
        {error && <div className="form-item-error">{error.message}</div>}
      </div>
    )
  }, [value, options, isCreating, isNewOption, triggerStyle?.width])

  useEffect(() => {
    if (isOpen) {
      setTriggerStyle(ref?.getBoundingClientRect())
    }
  }, [isOpen])

  useEffect(() => {
    if (helper.isValid(keyword)) {
      setOptions(
        rawOptions.filter(row =>
          (row[labelKey] as string).toLowerCase().includes(keyword!.toLowerCase())
        )
      )

      if (createRequest) {
        setIsNewOption(!rawOptions.map(row => row[labelKey]).includes(keyword!))
      }
    } else {
      setOptions(rawOptions)
      setIsNewOption(false)
    }
  }, [keyword, rawOptions])

  return (
    <>
      <div
        ref={setRef}
        className={clsx(
          'select',
          {
            'select-error': isHasError
          },
          className
        )}
        tabIndex={0}
        onClick={handleClick}
      >
        <button
          type="button"
          className={clsx('select-button multiple-select-button', {
            'multiple-selected': helper.isValidArray(value)
          })}
          disabled={loading || disabled}
          {...restProps}
        >
          <div className="multiple-select-value">
            {selected.map(option => (
              <MultipleItem
                key={option[valueKey] as string}
                option={option}
                labelKey={labelKey}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <span className="select-arrow-icon">{loading ? <Spin /> : <IconSelector />}</span>
        </button>
      </div>

      <Popup
        visible={isOpen}
        referenceRef={ref as Element}
        popperOptions={popperOptions}
        onExited={handleExitedCallback}
      >
        {memoOverlay}
      </Popup>
    </>
  )
}

export default Multiple
