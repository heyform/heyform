import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Loader, Modal } from '@/components'
import { ChangelogService } from '@/services'
import { useModal } from '@/store'
import { ChangelogType } from '@/types'
import { formatDay } from '@/utils'

const Skeleton = () => {
  return (
    <div className="flex h-[calc(100vh-6.5rem)] items-center justify-center">
      <Loader />
    </div>
  )
}

const Changelogs = () => {
  const { i18n } = useTranslation()
  const [changelogs, setChangelogs] = useState<ChangelogType[]>([])

  async function fetch() {
    setChangelogs(await ChangelogService.list())

    return true
  }

  return (
    <Async fetch={fetch} loader={<Skeleton />}>
      <div className="space-y-14">
        {changelogs.map(c => (
          <div key={c.id} className="text-sm/6">
            <div className="mb-1 text-secondary">
              {formatDay(dayjs(c.publishedAt), i18n.language)}
            </div>
            <h2 className="text-2xl/6 font-bold">{c.title}</h2>
            <div className="changelog" dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        ))}
      </div>
    </Async>
  )
}

export default function ChangelogsModal() {
  const { t } = useTranslation()
  const { isOpen, onOpenChange } = useModal('ChangelogsModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('workspace.sidebar.whatsNew')}
      contentProps={{
        className:
          'outline-none h-[80vh] sm:h-screen sm:max-h-screen sm:duration-600 sm:rounded-r-none sm:border-r-0 sm:top-0 sm:left-[initial] sm:right-0 sm:translate-y-0 sm:translate-x-0 data-[state=open]:sm:!slide-in-from-top-0 data-[state=closed]:sm:!slide-out-to-top-0 data-[state=open]:sm:slide-in-from-right-[80%] data-[state=closed]:sm:zoom-out-100 data-[state=open]:sm:zoom-in-100 data-[state=closed]:sm:slide-out-to-right-[80%] data-[state=closed]:sm:slide-out-to-top-0 data-[state=open]:sm:slide-in-from-left-1/2'
      }}
      onOpenChange={onOpenChange}
    >
      <Changelogs />
    </Modal.Simple>
  )
}
