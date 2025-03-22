import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Button, useToast } from '@/components'
import { WorkspaceService } from '@/services'
import { useParam } from '@/utils'

export default function WorkspaceExportData() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const toast = useToast()

  const { loading, error, run } = useRequest(
    async () => {
      await WorkspaceService.exportData(workspaceId)

      toast({
        title: t('settings.exportData.successTip')
      })
    },
    {
      manual: true,
      refreshDeps: [workspaceId]
    }
  )

  return (
    <section id="exportData" className="border-b border-accent-light py-10">
      <h2 className="text-base font-semibold">{t('settings.exportData.title')}</h2>
      <p data-slot="text" className="mt-1 text-base/5 text-secondary sm:text-sm/5">
        {t('settings.exportData.description')}
      </p>

      <div className="mt-3">
        <Button.Ghost size="md" loading={loading} onClick={run}>
          {t('settings.exportData.button')}
        </Button.Ghost>
      </div>

      {error && !loading && <div className="text-sm/6 text-error">{error.message}</div>}
    </section>
  )
}
