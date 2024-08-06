import { helper } from '@heyform-inc/utils'
import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import clsx from 'clsx'
import type { CSSProperties, FC, MouseEvent } from 'react'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import { COUNTRIES } from '../consts'
import { AnyMap, IComponentProps } from '../typings'
import { stopEvent, useKey, useTranslation } from '../utils'
import { FlagIcon } from './FlagIcon'
import { XIcon } from './Icons'
import { Input } from './Input'
import { Popup } from './Popup'
import { Tooltip } from './Tooltip'

interface CountryType {
  value: string
  label: string
  callingCode: string
  slug: string
  example: string
}

interface ItemProps extends Omit<IComponentProps, 'onClick'> {
  country: CountryType
  enableCallingCode?: boolean
  isSelected?: boolean
  isHighlighted?: boolean
  onHover: (value: string) => void
  onClick: (value: string) => void
}

interface SelectProps extends Omit<IComponentProps, 'value' | 'onChange'> {
  popupClassName?: string
  autoWidth?: boolean
  options?: AnyMap[]
  labelKey?: string
  valueKey?: string
  value?: any
  allowClear?: boolean
  isHasError?: boolean
  loading?: boolean
  disabled?: boolean
  unmountOnExit?: boolean
  valueRender?: (option?: AnyMap) => JSX.Element
  placeholder?: string
  optionRender?: (option: AnyMap, isActive?: boolean) => JSX.Element
  onDropdownVisibleChange?: (isVisible: boolean) => void
  onChange?: (value: any) => void
}

interface CountrySelectProps extends Omit<SelectProps, 'options' | 'onChange'> {
  popupClassName?: string
  enableLabel?: boolean
  enableCallingCode?: boolean
  allowClear?: boolean
  onChange?: (value: any) => void
}

const Item: FC<ItemProps> = ({
  country,
  enableCallingCode,
  isSelected,
  isHighlighted,
  onHover,
  onClick,
  ...restProps
}) => {
  const { t } = useTranslation()

  function handleClick() {
    onClick(country.value)
  }

  function handleHover() {
    onHover(country.value)
  }

  return (
    <div
      id={`heyform-country-${country.value}`}
      className={clsx('heyform-radio', {
        'heyform-radio-selected': isSelected,
        'heyform-radio-highlighted': isHighlighted
      })}
      onMouseEnter={handleHover}
      onClick={handleClick}
      {...restProps}
    >
      <div className="heyform-radio-container">
        <div className="heyform-radio-content">
          <FlagIcon className="mr-2" countryCode={country.value} />
          {enableCallingCode && (
            <span className="heyform-radio-calling-code mr-2">+{country.callingCode}</span>
          )}
          <span className="heyform-radio-label">{t(country.label)}</span>
        </div>
        {isSelected && (
          <div className="heyform-radio-icon">
            <IconCheck />
          </div>
        )}
      </div>
    </div>
  )
}

export const CountrySelect: FC<CountrySelectProps> = ({
  className,
  popupClassName,
  value,
  enableLabel = true,
  enableCallingCode = false,
  allowClear = true,
  isHasError,
  placeholder,
  onDropdownVisibleChange,
  onChange
}) => {
  const { t } = useTranslation()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
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

  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string>()
  const [triggerStyle, setTriggerStyle] = useState<CSSProperties>()
  const [keyword, setKeyword] = useState<string>()
  const [countries, setCountries] = useState<Array<(typeof COUNTRIES)[number]>>(COUNTRIES)

  const selected = useMemo(() => {
    return COUNTRIES.find(option => option.value === value)
  }, [value])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    stopEvent(event)
    setIsOpen(true)
  }

  function handleExited() {
    setIsOpen(false)
    setTriggerStyle(undefined)
    setHighlighted(undefined)
  }

  function handleChange(newValue: string) {
    handleExited()
    setKeyword(undefined)
    onChange?.(newValue)
  }

  function handleKeywordChange(newKeyword: string) {
    setKeyword(newKeyword)
  }

  function handleHover(newValue: string) {
    setHighlighted(newValue)
  }

  const handleExitedCallback = useCallback(handleExited, [])
  const handleChangeCallback = useCallback(handleChange, [])
  const handleKeywordChangeCallback = useCallback(handleKeywordChange, [])
  const handleHoverCallback = useCallback(handleHover, [])

  const memoOverlay = useMemo(() => {
    return (
      <div
        className={clsx('heyform-select-popup', popupClassName)}
        style={{ width: triggerStyle?.width }}
        onMouseLeave={() => setHighlighted(undefined)}
      >
        <div className="w-full">
          <Input placeholder={t('Search country')} onChange={handleKeywordChangeCallback} />
          {countries.map(country => (
            <Item
              key={country.value}
              country={country}
              enableCallingCode={enableCallingCode}
              isSelected={country.value === value}
              isHighlighted={country.value === highlighted}
              onHover={handleHoverCallback}
              onClick={handleChangeCallback}
            />
          ))}
        </div>
      </div>
    )
  }, [value, highlighted, triggerStyle?.width, countries, keyword])

  function handleClear(event: any) {
    stopEvent(event)
    handleExited()
    setKeyword(undefined)
    onChange?.(undefined)
  }

  function scrollIntoView(value: string) {
    setTimeout(() => {
      document.getElementById(`heyform-country-${value}`)?.scrollIntoView({ block: 'nearest' })
    }, 0)
  }

  const handleArrowUp = useCallback(() => {
    const index = Math.max(
      1,
      countries.findIndex(country => country.value === highlighted)
    )

    const newHighlighted = countries[index - 1].value

    setHighlighted(newHighlighted)
    scrollIntoView(newHighlighted)
  }, [countries, highlighted])
  const handleArrowDown = useCallback(() => {
    const index = Math.min(
      countries.length - 1,
      countries.findIndex(country => country.value === highlighted)
    )

    const newHighlighted = countries[index + 1].value

    setHighlighted(newHighlighted)
    scrollIntoView(newHighlighted)
  }, [countries, highlighted])

  useKey('Enter', () => {
    handleChange(highlighted as string)
  })

  useKey('ArrowUp', handleArrowUp)
  useKey('ArrowDown', handleArrowDown)
  useKey('Escape', handleExited)

  useEffect(() => {
    startTransition(() => {
      if (helper.isNil(keyword) || keyword!.length < 1) {
        return setCountries(COUNTRIES)
      }

      const lowerKeyword = keyword!.toLowerCase()

      setCountries(
        COUNTRIES.filter(country => {
          const label = country.label.toLowerCase()
          const localeLabel = t(country.label).toLowerCase()
          const valueText = country.value.toLowerCase()

          return (
            label.includes(lowerKeyword) ||
            localeLabel.includes(lowerKeyword) ||
            valueText.includes(lowerKeyword)
          )
        })
      )
    })
  }, [keyword])

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('heyform-dropdown-open')
      setTriggerStyle(ref?.getBoundingClientRect())
    } else {
      document.body.classList.remove('heyform-dropdown-open')
    }

    onDropdownVisibleChange?.(isOpen)
  }, [isOpen])

  return (
    <>
      <div
        ref={setRef}
        className={clsx(
          'heyform-select',
          {
            'heyform-select-open': isOpen,
            'select-error': isHasError
          },
          className
        )}
        onClick={handleClick}
      >
        <div className="heyform-select-container">
          <div className="heyform-select-value">
            {selected && <FlagIcon className="mr-2" countryCode={selected.value} />}
            {enableLabel && (
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <span className="heyform-select-label" data-placeholder={placeholder}>
                {selected && t(selected.label)}
              </span>
            )}
          </div>

          {selected && allowClear && (
            <Tooltip className="heyform-select-clear" ariaLabel={t('Clear')}>
              <button type="button" onClick={handleClear}>
                <XIcon />
              </button>
            </Tooltip>
          )}

          <div className="heyform-select-arrow-icon">
            {isOpen ? <IconChevronUp /> : <IconChevronDown />}
          </div>
        </div>
        <div className="heyform-group-highlight" />
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
