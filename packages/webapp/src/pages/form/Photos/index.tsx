import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { IconCamera, IconEye, IconDownload } from '@tabler/icons-react'
import { SubmissionService } from '@/services'
import { useParam, formatDay, unixDate } from '@/utils'
import { Button, EmptyState, Lightbox, Loader } from '@/components'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

interface PhotoItem {
  url: string
  filename: string
  submitDate: string
  submissionId: string
}

export default function FormPhotos() {
  const { t, i18n } = useTranslation()
  const { formId } = useParam()

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  const getUrlAndFilename = (value: any) => {
    if (typeof value === 'string') {
      return { url: value, filename: value.split('/').pop() || 'file' }
    }
    if (value && typeof value === 'object') {
      const filename = value.filename || 'file'
      const url = `${value.cdnUrlPrefix}/${value.cdnKey}`
      return { url, filename }
    }
    return null
  }

  const { data: photos = [], loading } = useRequest(
    async () => {
      // Fetch submissions with a high limit to get all photo submissions
      const { submissions } = await SubmissionService.submissions({
        formId,
        category: 'inbox',
        page: 1,
        limit: 5000
      })

      const collected: PhotoItem[] = []

      for (const sub of submissions) {
        const dateStr = sub.endAt ? formatDay(unixDate(sub.endAt), i18n.language) : ''
        for (const answer of sub.answers) {
          if (answer.kind === FieldKindEnum.FILE_UPLOAD) {
            const parsed = getUrlAndFilename(answer.value)
            if (parsed && isImageFile(parsed.filename)) {
              collected.push({
                url: parsed.url,
                filename: parsed.filename,
                submitDate: dateStr,
                submissionId: sub.id
              })
            }
          }
        }
      }

      return collected
    },
    {
      refreshDeps: [formId]
    }
  )

  const handleDownloadAll = () => {
    photos.forEach((photo, index) => {
      setTimeout(() => {
        window.open(photo.url, '_blank')
      }, index * 300)
    })
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-23.45rem)] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="mt-6 px-6">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-lg font-semibold text-primary">Photos Gallery</h2>
        {photos.length > 0 && (
          <Button size="md" onClick={handleDownloadAll} className="flex items-center gap-2">
            <IconDownload className="h-5 w-5" />
            <span>Download All</span>
          </Button>
        )}
      </div>

      {photos.length === 0 ? (
        <EmptyState
          className="flex h-[calc(100vh-26.5rem)] flex-col items-center justify-center border-0 bg-transparent p-0"
          icon={<IconCamera className="h-12 w-12 text-secondary" />}
          headline="No photos submitted yet"
          subHeadline="Uploaded images from file upload questions will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, idx) => (
            <div
              key={`${photo.submissionId}-${idx}`}
              className="group relative cursor-pointer overflow-hidden rounded-lg aspect-square bg-accent-light"
              onClick={() => setLightboxSrc(photo.url)}
            >
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <IconEye className="text-white h-8 w-8" />
                <span className="absolute bottom-3 left-3 text-xs text-white font-medium">
                  {photo.submitDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        visible={lightboxSrc !== null}
        src={lightboxSrc || ''}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  )
}
