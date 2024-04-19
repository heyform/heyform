import { helper } from '@heyform-inc/utils'
import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import clsx from 'clsx'
import type { CSSProperties, FC, MouseEvent } from 'react'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import { Popup, stopEvent } from '@/components/ui'
import { SelectProps } from '@/components/ui/select/Native'

import { COUNTRIES } from '../consts'
import { useTranslation } from '../utils'
import { FlagIcon } from './FlagIcon'
import { Input } from './Input'

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
  onClick: (value: string) => void
}

interface CountrySelectProps extends Omit<SelectProps, 'options'> {
  popupClassName?: string
  enableLabel?: boolean
  enableCallingCode?: boolean
}

const Item: FC<ItemProps> = ({ country, enableCallingCode, isSelected, onClick, ...restProps }) => {
  const { t } = useTranslation()

  function handleClick() {
    onClick(country.value)
  }

  return (
    <div
      className={clsx('heyform-radio', {
        'heyform-radio-selected': isSelected
      })}
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
  }

  function handleChange(newValue: string) {
    handleExited()
    setKeyword(undefined)
    onChange?.(newValue)
  }

  function handleKeywordChange(newKeyword: string) {
    setKeyword(newKeyword)
  }

  const handleExitedCallback = useCallback(handleExited, [])
  const handleChangeCallback = useCallback(handleChange, [])
  const handleKeywordChangeCallback = useCallback(handleKeywordChange, [])

  const memoOverlay = useMemo(() => {
    return (
      <div
        className={clsx('heyform-select-popup', popupClassName)}
        style={{ width: triggerStyle?.width }}
      >
        <div className="w-full">
          <Input placeholder={t('Search country')} onChange={handleKeywordChangeCallback} />
          {countries.map(country => (
            <Item
              key={country.value}
              country={country}
              enableCallingCode={enableCallingCode}
              isSelected={country.value === value}
              onClick={handleChangeCallback}
            />
          ))}
        </div>
      </div>
    )
  }, [value, triggerStyle?.width, countries, keyword])

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
      setTriggerStyle(ref?.getBoundingClientRect())
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
              <span className="heyform-select-label">{selected && t(selected.label)}</span>
            )}
          </div>
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
