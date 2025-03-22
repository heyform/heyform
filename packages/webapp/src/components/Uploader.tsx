import { formatBytes, helper, parseBytes } from '@heyform-inc/utils'
import { IconUpload } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { ChangeEvent, DragEvent, FC, MouseEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AppService, UserService, WorkspaceService } from '@/services'
import { cn, useParam } from '@/utils'

import { Loader } from './Loader'

export interface UploaderProps extends Omit<ComponentProps, 'onChange'> {
  title?: string
  description?: string
  accept?: string[]
  maxSize?: string
  onChange?: (value?: string) => void
}

const MAX_SIZE = '2MB'
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/gif']

export const Uploader: FC<UploaderProps> = ({
  className,
  accept = ACCEPT_TYPES,
  maxSize = MAX_SIZE,
  title,
  description,
  onChange
}) => {
  const { t } = useTranslation()
  const { workspaceId } = useParam()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const dragoverRef = useRef<HTMLDivElement | null>(null)

  const [file, setFile] = useState<File | undefined>()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string>()

  const { loading, runAsync } = useRequest(
    async (file: File) => {
      if (!file) {
        return
      }

      let data: AnyMap

      if (helper.isValid(workspaceId)) {
        data = await WorkspaceService.cdnToken(workspaceId, file.name, file.type)
      } else {
        data = await UserService.cdnToken(file.name, file.type)
      }

      const { token, urlPrefix, key } = data
      const url = `${urlPrefix}/${key}`

      await AppService.upload(file, key, token)

      return url
    },
    {
      manual: true,
      onError: err => setError(err.message)
    }
  )

  async function handleUpload(newFile: File) {
    setError(undefined)

    if (newFile.size > (parseBytes(maxSize) as number)) {
      return setError(t('components.uploader.exceedsMaxSize', { maxSize }))
    }

    if (!accept.includes(newFile.type)) {
      return setError(t('components.uploader.invalidType'))
    }

    setFile(newFile)

    const result = await runAsync(newFile)
    onChange?.(result)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    if (loading) {
      return
    }

    if (event.type === 'dragenter') {
      setDragging(true)
      dragoverRef.current = event.target as HTMLDivElement

      return
    }

    if (event.type === 'dragleave') {
      if (event.target === dragRef.current && event.target === dragoverRef.current) {
        setDragging(false)
      }
      return
    }

    if (event.type === 'dragover') {
      return
    }

    setDragging(false)
    dragoverRef.current = null

    handleUpload(event.dataTransfer.files[0])
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.target

    if (files && files.length > 0) {
      handleUpload(files[0])
    }

    if (inputRef.current) {
      inputRef.current.value = null as Any
    }
  }

  function handleOpen(event: MouseEvent) {
    event.stopPropagation()

    if (!loading) {
      inputRef.current?.click()
    }
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        'flex h-full w-full cursor-pointer justify-center rounded-lg border border-dashed border-input p-6 data-[dragging]:border-blue-600',
        className
      )}
      data-dragging={dragging ? '' : undefined}
      role="presentation"
      onClick={handleOpen}
      onDrop={handleDrop}
      onDragOver={handleDrop}
      onDragEnter={handleDrop}
      onDragLeave={handleDrop}
    >
      <input
        className="hidden opacity-0"
        type="file"
        ref={inputRef}
        accept={accept.join(',')}
        onChange={handleFileChange}
      />
      <div className="flex flex-col justify-center text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center">
          {loading ? (
            <Loader className="h-7 w-7" />
          ) : (
            <IconUpload className="non-scaling-stroke h-full w-full" />
          )}
        </div>

        <div className="mt-5">
          <div className="text-sm/6 font-medium text-primary">
            {file ? (
              <span>
                {file.name} ({formatBytes(file!.size)})
              </span>
            ) : (
              title || t('components.uploader.headline')
            )}
          </div>

          {error ? (
            <p className="text-xs/6 text-error">{error}</p>
          ) : (
            <p className="text-xs/6 text-secondary">
              {file
                ? loading
                  ? t('components.uploader.uploading')
                  : t('components.uploader.reselectFile')
                : description ||
                  t('components.uploader.subHeadline', {
                    fileTypes: accept.map(t => t.split('/')[1].toUpperCase()).join(', '),
                    maxSize
                  })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
