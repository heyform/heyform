import type { FC } from 'react'
import { useState } from 'react'

import { AppService } from '@/service'

import type { DragUploaderProps } from './DragUploader'
import { DragUploader } from './DragUploader'

interface UploaderProps extends Omit<DragUploaderProps, 'value' | 'onChange'> {
  value?: string
  onChange?: (src: string) => void
}

export const Uploader: FC<UploaderProps> = ({ value, onChange, ...restProps }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>()

  async function handleChange(file: File) {
    if (loading) {
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { url } = await AppService.upload(file)

      onChange?.(url)
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return <DragUploader {...restProps} error={error} loading={loading} onChange={handleChange} />
}
