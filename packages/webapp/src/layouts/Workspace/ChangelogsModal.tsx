import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'

import { formatDay } from '@/utils'

import { Modal } from '@/components'
import { useModal } from '@/store'
import { ChangelogType } from '@/types'

export default function ChangelogsModal() {
  const { t, i18n } = useTranslation()
  const { isOpen, payload, onOpenChange } = useModal<ChangelogType>('ChangelogsModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('workspace.sidebar.whatsNew')}
      contentProps={{
        className: 'outline-none'
      }}
      onOpenChange={onOpenChange}
    >
      {payload && (
        <div className="text-sm/6">
          <div className="text-secondary mb-1">
            {formatDay(dayjs(payload.publishedAt), i18n.language)}
          </div>
          <h2 className="text-2xl/6 font-bold">
            <a href={payload.url} target="_blank" rel="noreferrer" className="hover:underline">
              {payload.version}
            </a>
          </h2>
          <div className="changelog">
            <Markdown>{payload.changelog}</Markdown>
          </div>
        </div>
      )}
    </Modal.Simple>
  )
}
