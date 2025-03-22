import { helper } from '@heyform-inc/utils'
import {
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconDatabase,
  IconListDetails,
  IconPlayerPlay,
  IconSend2,
  IconSettings,
  IconShare
} from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Button,
  Loader,
  OnboardingBadge,
  Tooltip,
  useOnboardingStorage,
  usePrompt,
  useToast
} from '@/components'
import { ADD_QUESTION2_STORAGE_NAME, PUBLISH_FORM_STORAGE_NAME } from '@/consts'
import { FormService } from '@/services'
import { useAppStore, useFormStore, useWorkspaceStore } from '@/store'
import { useParam, useRouter } from '@/utils'

import WorkspaceAccount from '../../../layouts/Workspace/WorkspaceAccount'
import { useStoreContext } from './store'
import { getFilteredFields } from './utils'

export default function BuilderNavBar() {
  const { t } = useTranslation()

  const router = useRouter()
  const toast = useToast()
  const prompt = usePrompt()
  const { setItem } = useOnboardingStorage()

  const { workspaceId, projectId, formId } = useParam()
  const { openModal } = useAppStore()
  const { state } = useStoreContext()
  const { workspace, project } = useWorkspaceStore()
  const { form, updateForm } = useFormStore()

  const { loading, run } = useRequest(
    async () => {
      if (
        (helper.isValid(form?.version) && form!.version > 0) ||
        (form!.version === 0 && !form?.fieldsUpdatedAt)
      ) {
        const { fields } = getFilteredFields(state.fields!)

        await FormService.publishForm({
          formId,
          version: form!.version as number,
          drafts: fields
        })

        updateForm({
          canPublish: false
        })

        router.push(`/workspace/${workspaceId}/project/${projectId}/form/${formId}/share`)
      }
    },
    {
      manual: true,
      refreshDeps: [formId, state.fields, form?.version],
      onError: (err: any) => {
        toast({
          title: t('components.error.title'),
          message: err.message
        })
      }
    }
  )

  function handlePreview() {
    openModal('PreviewModal')
  }

  function handleNavigateTo(route: string) {
    router.push(`/workspace/${workspaceId}/project/${projectId}/form/${formId}/${route}`)
  }

  function handlePublish() {
    setItem(PUBLISH_FORM_STORAGE_NAME, true)
    run()
  }

  function handleRename() {
    prompt({
      value: form,
      title: t('project.rename.headline'),
      inputProps: {
        name: 'name',
        label: t('project.rename.name.label'),
        rules: [
          {
            required: true,
            message: t('project.rename.name.required')
          }
        ]
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('components.save')
      },
      fetch: async values => {
        await FormService.update(formId, values)
        updateForm(values)
      }
    })
  }

  useEffect(() => {
    if (form?.canPublish) {
      setItem(ADD_QUESTION2_STORAGE_NAME, true)
    }
  }, [])

  return (
    <div className="flex h-14 items-center justify-between px-2">
      <nav aria-label="breadcrumb" className="flex">
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-secondary">
          {window.heyform.device.mobile ? (
            <li className="text-primary">
              <Link
                role="link"
                aria-disabled="true"
                aria-current="page"
                className="line-clamp-1 flex h-6 max-w-40 items-center gap-x-2 sm:h-auto sm:max-w-max"
                to={`/workspace/${workspaceId}/project/${projectId}/`}
              >
                <IconChevronLeft className="h-5 w-5" />
                {form?.name}
              </Link>
            </li>
          ) : (
            <>
              <li>
                <Link
                  className="transition-colors hover:text-primary"
                  to={`/workspace/${workspaceId}/`}
                >
                  {workspace?.name}
                </Link>
              </li>

              <li role="presentation" aria-hidden="true">
                <IconChevronRight className="h-3.5 w-3.5" />
              </li>

              <li>
                <Link
                  className="transition-colors hover:text-primary"
                  to={`/workspace/${workspaceId}/project/${projectId}/`}
                >
                  {project?.name}
                </Link>
              </li>

              <li role="presentation" aria-hidden="true">
                <IconChevronRight className="h-3.5 w-3.5" />
              </li>

              <li className="text-primary">
                <button
                  type="button"
                  aria-current="page"
                  className="font-normal underline-offset-4 hover:underline"
                  onClick={handleRename}
                >
                  {form?.name}
                </button>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="flex h-9 items-center gap-4">
        <div className="flex items-center gap-1">
          {state.isSyncing && (
            <Tooltip label={t('form.builder.navbar.syncing')}>
              <Loader className="h-5 w-5" />
            </Tooltip>
          )}

          <Tooltip label={t('form.builder.preview.title')}>
            <Button.Link size="md" iconOnly onClick={handlePreview}>
              <IconPlayerPlay className="h-5 w-5" />
            </Button.Link>
          </Tooltip>

          <Button.Link
            className="block sm:hidden"
            size="md"
            iconOnly
            onClick={() => openModal('BuilderLeftSidebarModal')}
          >
            <IconListDetails className="h-5 w-5" />
          </Button.Link>

          <Tooltip label={t('form.share.title')}>
            <Button.Link
              className="hidden sm:block"
              size="md"
              iconOnly
              onClick={() => handleNavigateTo('share')}
            >
              <IconShare className="h-5 w-5" />
            </Button.Link>
          </Tooltip>

          <Tooltip label={t('form.integrations.title')}>
            <Button.Link
              className="hidden sm:block"
              size="md"
              iconOnly
              onClick={() => handleNavigateTo('integrations')}
            >
              <IconBolt className="h-5 w-5" />
            </Button.Link>
          </Tooltip>

          <Tooltip label={t('form.submissions.title')}>
            <Button.Link
              className="hidden sm:block"
              size="md"
              iconOnly
              onClick={() => handleNavigateTo('submissions')}
            >
              <IconDatabase className="h-5 w-5" />
            </Button.Link>
          </Tooltip>

          <Tooltip label={t('form.settings.title')}>
            <Button.Link
              className="hidden sm:block"
              size="md"
              iconOnly
              onClick={() => handleNavigateTo('settings')}
            >
              <IconSettings className="h-5 w-5" />
            </Button.Link>
          </Tooltip>
        </div>

        <Button
          size="md"
          disabled={!form?.canPublish || state.isSyncing}
          loading={loading}
          onClick={handlePublish}
        >
          <IconSend2 className="h-5 w-5" />
          {t('components.publish')}

          {form?.canPublish && (
            <OnboardingBadge
              className="-right-1 -top-1"
              name={PUBLISH_FORM_STORAGE_NAME}
              precondition={ADD_QUESTION2_STORAGE_NAME}
            />
          )}
        </Button>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="h-6 w-px bg-accent-light"></div>

          <WorkspaceAccount
            className="!p-0 hover:!bg-transparent hover:!outline-none [&_[data-slot=avatar]]:h-9 [&_[data-slot=avatar]]:w-9"
            containerClassName="!p-0 border-none flex items-center"
            isNameVisible={false}
          />
        </div>
      </div>
    </div>
  )
}
