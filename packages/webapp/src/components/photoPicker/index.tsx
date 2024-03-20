import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal, Tabs } from '@/components/ui'

import { Uploader } from '../Uploader'
import { Unsplash } from './Unsplash'
import './style.scss'

interface PhotoPickerProps extends Omit<IComponentProps, 'onChange'>, IModalProps {
  value?: string
  onChange?: (value: string) => void
}

const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif']

export const PhotoPicker: FC<PhotoPickerProps> = ({
  className,
  visible,
  value,
  onClose,
  onChange,
  ...restProps
}) => {
  function handleChange(src: string) {
    onChange?.(src)
    onClose?.()
  }

  const { t } = useTranslation()
  return (
    <Modal
      className="photo-picker"
      visible={visible}
      onClose={onClose}
      showCloseIcon
      {...restProps}
    >
      <Tabs>
        <Tabs.Pane name="upload" title={t('other.Upload')}>
          <Uploader accept={ACCEPTED_MIMES} onChange={handleChange} />
        </Tabs.Pane>
        <Tabs.Pane name="unsplash" title="Unsplash">
          <Unsplash onChange={handleChange} />
        </Tabs.Pane>
      </Tabs>
    </Modal>
  )
}
