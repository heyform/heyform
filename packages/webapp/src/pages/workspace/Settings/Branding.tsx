import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { PlanUpgrade, Switch } from '@/components'
import { PlanGradeEnum } from '@/consts'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

import WorkspaceBrandKit from './BrandKit'
import WorkspaceCustomDomain from './CustomDomain'

export default function WorkspaceBranding() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace, updateWorkspace } = useWorkspaceStore()

  const { run: handleRemoveBrandingChange } = useRequest(
    async (removeBranding: boolean) => {
      const updates = {
        removeBranding
      }

      updateWorkspace(workspaceId, updates)
      await WorkspaceService.update(workspaceId, updates)
    },
    {
      manual: true,
      refreshDeps: [workspaceId]
    }
  )

  return (
    <section id="branding" className="border-b border-accent-light py-10">
      <h2 className="text-lg font-semibold">{t('settings.branding.title')}</h2>

      <div className="mt-4 space-y-8">
        <WorkspaceBrandKit />

        <div className="flex items-start gap-8">
          <div className="flex-1">
            <label className="text-base/7 font-medium sm:text-sm/5">
              {t('settings.branding.removeBrandingHeadline')}
            </label>
            <p data-slot="text" className="text-base/5 text-secondary sm:text-sm/5">
              {t('settings.branding.removeBrandingSubHeadline')}
            </p>
          </div>

          <div className="pt-2">
            <PlanUpgrade
              minimalGrade={PlanGradeEnum.PREMIUM}
              tooltipLabel={t('billing.upgrade.removeBranding')}
            >
              <Switch value={workspace?.removeBranding} onChange={handleRemoveBrandingChange} />
            </PlanUpgrade>
          </div>
        </div>

        <WorkspaceCustomDomain />
      </div>
    </section>
  )
}
