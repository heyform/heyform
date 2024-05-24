import { helper } from '@heyform-inc/utils'
import { IconTrash } from '@tabler/icons-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ImageIcon, PhotoPicker } from '@/components'
import { Button, Tooltip } from '@/components/ui'

interface BackgroundImageProps {
  value?: string
  onChange?: (value?: string) => void
}

export const BackgroundImage: FC<BackgroundImageProps> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false)
  const isEnabled = helper.isURL(value)
	const { t } = useTranslation()

  function handleOpen() {
    setVisible(true)
  }

  function handleClose() {
    setVisible(false)
  }

  function handleChange(newValue: string) {
    onChange?.(newValue)
    handleClose()
  }

  function handleRemove() {
    onChange?.()
  }

  return (
    <>
      <div className="right-sidebar__cover-image flex items-center justify-between">
        <label className="form-item-label">{t('BackgroundImage')}</label>
        {isEnabled ? (
          <div className="flex items-center">
            <Tooltip ariaLabel="Change">
              <Button
                className="mr-2 px-2 py-1"
                leading={<ImageIcon />}
                aria-label="Change background image"
                onClick={handleOpen}
              />
            </Tooltip>
            <Tooltip ariaLabel="Delete">
              <Button
                className="px-2 py-1"
                leading={<IconTrash />}
                aria-label="Delete background image"
                onClick={handleRemove}
              />
            </Tooltip>
          </div>
        ) : (
          <Button className="px-2 py-1" onClick={handleOpen}>
            {t('formBuilder.addImage')}
          </Button>
        )}
      </div>

      <PhotoPicker visible={visible} onClose={handleClose} onChange={handleChange} />
    </>
  )
}
