import { useTranslation } from 'react-i18next'

import { CreateWorkspaceForm } from '@/layouts/Workspace/CreateWorkspaceModal'

export default function CreateWorkspace() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold">{t('workspace.creation.headline')}</h1>
      <p className="mt-2 text-sm text-secondary">{t('workspace.creation.subHeadline')}</p>
      <div className="mt-10">
        <CreateWorkspaceForm />
      </div>
    </div>
  )
}
