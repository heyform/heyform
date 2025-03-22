import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { ImageFormPicker, Input } from '@/components'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

export default function WorkspaceGeneral() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace, updateWorkspace } = useWorkspaceStore()

  const { run: handleNameChange } = useRequest(
    async (name: string) => {
      const updates = {
        name
      }

      updateWorkspace(workspaceId, updates)
      await WorkspaceService.update(workspaceId, updates)
    },
    {
      debounceWait: 300,
      manual: true,
      refreshDeps: [workspaceId]
    }
  )

  const { run: handleAvatarChange } = useRequest(
    async (avatar?: string) => {
      const updates = {
        avatar
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
    <section id="general" className="border-b border-accent-light pb-10">
      <h2 className="text-lg font-semibold">{t('settings.general.title')}</h2>

      <div className="mt-4 space-y-8">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm/6 font-medium leading-6 text-primary">
            {t('settings.general.name')}
          </label>
          <Input id="name" value={workspace?.name} onChange={handleNameChange} />
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              {t('settings.general.logo')}
            </label>
            <p data-slot="text" className="text-base/5 text-secondary sm:text-sm/5">
              {t('settings.general.pickLogo')}
            </p>
          </div>
          <ImageFormPicker
            value={workspace?.avatar}
            fallback={workspace?.name}
            resize={{
              width: 100,
              height: 100
            }}
            onChange={handleAvatarChange}
          />
        </div>
      </div>
    </section>
  )
}
