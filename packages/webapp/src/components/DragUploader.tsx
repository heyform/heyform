import { formatBytes, parseBytes } from '@heyform-inc/utils'
import { IconFile, IconUpload } from '@tabler/icons-react'
import clsx from 'clsx'
import type { ChangeEvent, DragEvent, FC, MouseEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, stopEvent } from '@/components/ui'

export interface DragUploaderProps extends Omit<IComponentProps, 'onChange'> {
  value?: File
  loading?: boolean
  error?: Error | null
  accept?: string[]
  maxSize?: string
  selectText?: string
  reselectText?: string
  uploadingText?: string
  onChange?: (file: File) => void
}

export const DragUploader: FC<DragUploaderProps> = ({
  className,
  value,
  loading = false,
  error,
  accept = [],
  maxSize = '2MB',
  selectText = 'other.DragUploader.upload',
  reselectText = 'Re-select file to upload',
  uploadingText = 'Uploading',
  onChange,
  ...restProps
}) => {
  const [file, setFile] = useState<File | undefined>(value)
  const [fileInputRef, setFileInputRef] = useState<any>()
  const [dragRef, setDragRef] = useState<any>()
  const [dragoverRef, setDragoverRef] = useState<any>()
  const [dragging, setDragging] = useState(false)
  const [internalError, setInternalError] = useState<Error | null>(null)
  const { t } = useTranslation()

  function handleChange(f: File) {
    if (f.size > parseBytes(maxSize)!) {
      return setInternalError(new Error(`The selected file exceeds the ${maxSize} file limit`))
    }

    if (!accept.includes(f.type)) {
      return setInternalError(new Error('Unsupported file type'))
    }

    setFile(f)
    onChange?.(f)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    if (event.type === 'dragenter') {
      setDragoverRef(event.target)
      setDragging(true)
      return
    }

    if (event.type === 'dragleave') {
      if (event.target === dragRef && event.target === dragoverRef) {
        setDragging(false)
      }
      return
    }

    if (event.type === 'dragover') {
      return
    }

    setDragoverRef(undefined)
    setDragging(false)

    handleChange(event.dataTransfer.files[0])
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.target

    if (files && files.length > 0) {
      handleChange(files[0])
    }

    if (fileInputRef) {
      fileInputRef.value = null
    }
  }

  function handleOpen(event: MouseEvent) {
    fileInputRef?.click()
    stopEvent(event)
  }

  return (
    <div className={clsx('drag-uploader', className)} {...restProps}>
      <input
        className="hidden"
        type="file"
        ref={setFileInputRef}
        accept={accept.join(',')}
        onChange={handleFileChange}
      />
      {file ? (
        <div className="flex h-full w-full justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
          <div className="flex flex-col justify-center space-y-1 text-center">
            <IconFile className="non-scaling-stroke mx-auto h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-500">
              {file!.name} <span>({formatBytes(file!.size)})</span>
            </p>
            <div className="flex items-center justify-center text-sm">
              <Button.Link type="primary" loading={loading} onClick={handleOpen}>
                {loading ? uploadingText : reselectText}
              </Button.Link>
            </div>
            {error && <p className="text-xs text-red-500">{error.message}</p>}
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            'flex h-full w-full justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5',
            {
              'border-blue-500': dragging
            }
          )}
          ref={setDragRef}
          onDrop={handleDrop}
          onDragOver={handleDrop}
          onDragEnter={handleDrop}
          onDragLeave={handleDrop}
        >
          <div className="flex flex-col justify-center space-y-1 text-center">
            <IconUpload className="non-scaling-stroke mx-auto h-12 w-12 text-slate-400" />
            <div className="flex items-center justify-center text-sm text-slate-500">
              <Button.Link type="primary" onClick={handleOpen}>
                {t(selectText)}
              </Button.Link>
              <p className="pl-1">{t('other.DragUploader.drag')}</p>
            </div>
            {error || internalError ? (
              <p className="text-xs text-red-500">{error?.message || internalError?.message}</p>
            ) : (
              <p className="text-xs text-slate-500">
                {t('other.DragUploader.upTo')} {maxSize}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
