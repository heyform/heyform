import { QRCodeCanvas } from 'qrcode.react'
import { FC, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Modal } from '@/components'
import { useModal } from '@/store'

interface QRCodeComponentProps {
  url: string
  onClose: () => void
}

const QRCodeComponent: FC<QRCodeComponentProps> = ({ url, onClose }) => {
  const { t } = useTranslation()
  const wrapRef = useRef<HTMLDivElement | null>(null)

  function handleDownload() {
    const canvasElem = wrapRef.current?.querySelector('canvas')

    if (canvasElem) {
      const a = document.createElement('a')

      a.download = 'qrcode.png'
      a.href = canvasElem.toDataURL('image/png')
      a.click()
    }
  }

  return (
    <div className="space-y-6">
      <div ref={wrapRef} className="flex justify-center">
        <QRCodeCanvas value={url} size={240} />
      </div>

      <div className="flex items-center justify-end gap-x-4">
        <Button.Ghost size="sm" onClick={onClose}>
          {t('components.cancel')}
        </Button.Ghost>
        <Button size="sm" onClick={handleDownload}>
          {t('form.share.link.qrcode.download')}
        </Button>
      </div>
    </div>
  )
}

export default function QRCodeModal() {
  const { t } = useTranslation()
  const { isOpen, payload, onOpenChange } = useModal('QRCodeModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('form.share.link.qrcode.title')}
      contentProps={{
        className: 'max-w-80'
      }}
      onOpenChange={onOpenChange}
    >
      <QRCodeComponent url={payload?.url} onClose={() => onOpenChange(false)} />
    </Modal.Simple>
  )
}
