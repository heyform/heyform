import { FC, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import { Portal } from './Portal'

interface LightboxProps {
  visible: boolean
  src: string
  onClose: () => void
}

export const Lightbox: FC<LightboxProps> = ({ visible, src, onClose }) => {
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <Portal visible={visible}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
        onClick={onClose}
      >
        <button
          className="absolute right-6 top-6 text-white hover:text-gray-300 focus:outline-none transition-colors"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <IconX className="h-8 w-8" />
        </button>
        <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
          <img
            src={src}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      </div>
    </Portal>
  )
}
