import { preventDefault } from '@heyform-inc/form-renderer'
import {
  Close,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger
} from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { IconX } from '@tabler/icons-react'
import { FC, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

import { Avatar } from './Avatar'
import { Button } from './Button'
import { GradientPicker } from './GradientPicker'
import { ImageProps } from './Image'
import { Tabs } from './Tabs'
import { UnsplashPicker } from './UnsplashPicker'
import { Uploader } from './Uploader'

type TabType = 'image' | 'unsplash' | 'gradient'

interface ImagePickerProps extends Pick<ImageProps, 'resize'>, DOMProps {
  ref?: Ref<ImagePickerRef>
  tabs: TabType[]
  tabConfigs?: AnyMap
  defaultTab?: TabType
  onOpenChange?: (open: boolean) => void
  onChange?: (value?: string) => void
}

interface ImageFormPickerProps extends Omit<Optional<ImagePickerProps, 'tabs'>, 'children'> {
  className?: string
  value?: string
  fallback?: string
}

export const ImageFormPicker: FC<ImageFormPickerProps> = ({
  className,
  value,
  fallback,
  tabs = ['image'],
  resize,
  ...restProps
}) => {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-x-3', className)}>
      <Avatar src={value} fallback={fallback} resize={resize} data-slot="avatar" />
      <ImagePicker tabs={tabs} {...restProps}>
        <Button.Ghost size="sm">{t('components.change')}</Button.Ghost>
      </ImagePicker>
    </div>
  )
}

export interface ImagePickerRef {
  open: () => void
  close: () => void
}

export const ImagePicker: FC<ImagePickerProps> = ({
  ref,
  tabs: rawTabs,
  tabConfigs = {},
  defaultTab,
  children,
  onOpenChange,
  onChange
}) => {
  const { t } = useTranslation()
  const [isOpen, setOpen] = useState(false)

  const handleChange = useCallback(
    (value?: string) => {
      setOpen(false)
      onChange?.(value)
    },
    [onChange]
  )

  const configs = useMemo(
    () => [
      {
        value: 'image',
        label: t('components.imagePicker.image'),
        content: <Uploader {...tabConfigs.image} onChange={handleChange} />
      },
      {
        value: 'gradient',
        label: t('components.imagePicker.gradient.title'),
        content: (
          <GradientPicker
            {...tabConfigs.gradient}
            className="scrollbar h-full px-4 pt-4"
            onChange={handleChange}
          />
        )
      },
      {
        value: 'unsplash',
        label: t('components.imagePicker.unsplash.title'),
        content: (
          <UnsplashPicker
            {...tabConfigs.unsplash}
            className="scrollbar h-full px-4 pt-4"
            onChange={handleChange}
          />
        )
      }
    ],
    [handleChange, t, tabConfigs.image, tabConfigs.unsplash]
  )
  const tabs = useMemo(
    () => configs.filter(tab => rawTabs.includes(tab.value as TabType)),
    [configs, rawTabs]
  )

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  useImperativeHandle<ImagePickerRef, ImagePickerRef>(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false)
    }),
    []
  )

  return (
    <Root open={isOpen} onOpenChange={setOpen}>
      <Trigger asChild>{children}</Trigger>
      <Portal>
        <Overlay className="fixed inset-0 z-10 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Content
          className="fixed bottom-0 left-0 right-0 z-10 w-full max-w-lg rounded-lg border border-accent-light bg-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-[80%] sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] data-[state=closed]:sm:zoom-out-95 data-[state=open]:sm:zoom-in-95 data-[state=closed]:sm:slide-out-to-left-1/2 data-[state=closed]:sm:slide-out-to-top-[48%] data-[state=open]:sm:slide-in-from-left-1/2 data-[state=open]:sm:slide-in-from-top-[48%]"
          onOpenAutoFocus={preventDefault}
        >
          <Title>
            <VisuallyHidden />
          </Title>
          <Description>
            <VisuallyHidden />
          </Description>
          <Tabs
            className="[&_[data-content=image]]:p-4 [&_[data-slot=content]]:h-96"
            tabs={tabs}
            defaultTab={defaultTab}
            action={
              <Close asChild>
                <Button.Link
                  className="-mt-2.5 text-secondary hover:text-primary"
                  size="sm"
                  iconOnly
                >
                  <span className="sr-only">{t('components.close')}</span>
                  <IconX className="h-5 w-5" />
                </Button.Link>
              </Close>
            }
          />
        </Content>
      </Portal>
    </Root>
  )
}
