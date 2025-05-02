import { preventDefault } from '@heyform-inc/form-renderer'
import { LayoutProps } from '@heyooo-inc/react-router'
import { IconChevronLeft, IconCopy, IconDots, IconTag, IconTrash } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import IconLink from '@/assets/link.svg?react'
import IconMoveTo from '@/assets/move-to.svg?react'
import { Button, Dropdown, Skeleton, Tooltip, useAlert, usePrompt } from '@/components'
import { FormService } from '@/services'
import { useFormStore, useWorkspaceStore } from '@/store'
import { cn, timeFromNow, useParam, useRouter } from '@/utils'

import { WorkspaceLayout } from '../Workspace'

const DROPDOWN_OPTIONS = [
  {
    value: 'rename',
    icon: <IconTag className="h-4 w-4" />,
    label: 'components.rename'
  },
  {
    value: 'duplicate',
    icon: <IconCopy className="h-4 w-4" />,
    label: 'components.duplicate'
  },
  {
    value: 'moveto',
    icon: <IconMoveTo className="h-4 w-4" />,
    label: 'components.moveto'
  },
  {
    value: 'trash',
    icon: <IconTrash className="h-4 w-4" />,
    label: 'components.delete'
  }
]

export const FormLayout: FC<LayoutProps> = ({ options, children }) => {
  const { t, i18n } = useTranslation()

  const alert = useAlert()
  const prompt = usePrompt()
  const router = useRouter()
  const { workspaceId, projectId, formId } = useParam()
  const { workspace, project, sharingURLPrefix } = useWorkspaceStore()
  const { form, setForm, updateForm } = useFormStore()

  const navigations = useMemo(
    () => [
      {
        value: 'analytics',
        label: t('form.analytics.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/analytics`
      },
      {
        value: 'submissions',
        label: t('form.submissions.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/submissions`
      },
      {
        value: 'integrations',
        label: t('form.integrations.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/integrations`
      },
      {
        value: 'share',
        label: t('form.share.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/share`
      },
      {
        value: 'settings',
        label: t('form.settings.title'),
        to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/settings`
      }
    ],
    [formId, projectId, workspaceId, t]
  )

  const status = useMemo(() => {
    if (form?.suspended) {
      return 'suspended'
    } else if (form?.isDraft) {
      return 'draft'
    } else if (form?.settings?.active) {
      return 'active'
    } else {
      return 'closed'
    }
  }, [form])

  const { loading } = useRequest(
    async () => {
      setForm(await FormService.detail(formId))
    },
    {
      refreshDeps: [formId]
    }
  )

  function handleEdit() {
    router.push(`/workspace/${workspaceId}/project/${projectId}/form/${formId}/create`)
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

  const { runAsync: handleDuplicate } = useRequest(
    async () => {
      const name = t('form.duplicate', { name: form?.name })
      const id = await FormService.duplicate(formId, name)

      router.push(`/workspace/${workspaceId}/project/${projectId}/form/${id}/create`)
    },
    {
      refreshDeps: [workspaceId, projectId, formId, form?.name],
      manual: true
    }
  )

  const { runAsync: handleMoveToTrash } = useRequest(
    async () => {
      await FormService.moveToTrash(formId)
      router.replace(`/workspace/${workspaceId}/project/${projectId}/`)
    },
    {
      refreshDeps: [workspaceId, projectId, formId],
      manual: true
    }
  )

  function handleMoveTo() {
    prompt({
      value: {
        projectId
      },
      title: t('project.moveto.headline', { name: form?.name }),
      selectProps: {
        className: 'w-full',
        name: 'projectId',
        rules: [
          {
            required: true,
            message: t('project.moveto.project.required')
          }
        ],
        options: workspace.projects || [],
        labelKey: 'name',
        valueKey: 'id'
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('components.save')
      },
      submitOnChangedOnly: true,
      fetch: async values => {
        const result = await FormService.moveToProject(formId, values.projectId)

        if (result) {
          router.replace(
            `/workspace/${workspaceId}/project/${values.projectId}/form/${formId}/analytics`
          )
        }
      }
    })
  }

  async function handleClick(value: string) {
    switch (value) {
      case 'rename':
        return handleRename()

      case 'duplicate':
        return handleDuplicate()

      case 'moveto':
        return handleMoveTo()

      case 'trash':
        return handleMoveToTrash()
    }
  }

  useEffect(() => {
    if (form?.suspended) {
      alert({
        title: t('form.suspend.headline'),
        description: t('form.suspend.subHeadline'),
        contentProps: {
          onPointerDownOutside: preventDefault,
          onEscapeKeyDown: preventDefault,
          onInteractOutside: preventDefault
        },
        confirmProps: {
          label: t('form.suspend.contactUs')
        },
        onConfirm() {
          window.location.href = 'https://heyform.net/f/E4MKK2hx'
        }
      })
    }
  }, [form?.suspended])

  return (
    <WorkspaceLayout options={options}>
      {/* Back to project */}
      <div className="max-lg:hidden">
        <Link
          className="-ml-[0.15rem] inline-flex items-center gap-2 text-sm/6 text-secondary hover:text-primary"
          to={`/workspace/${workspaceId}/project/${projectId}/`}
        >
          <IconChevronLeft className="h-4 w-4" />
          <span>{project?.name}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:flex-1">
          <Skeleton
            className="h-8 [&_[data-slot=skeleton]]:h-5 [&_[data-slot=skeleton]]:w-44 [&_[data-slot=skeleton]]:sm:h-6"
            loading={loading}
          >
            <div className="flex items-center gap-2">
              <h1 className="text-2xl/8 font-semibold sm:text-xl/8">{form?.name}</h1>

              <Dropdown
                contentProps={{
                  className:
                    'min-w-36 [&_[data-value=delete]]:text-error [&_[data-value=trash]]:text-error',
                  side: 'bottom',
                  sideOffset: 8,
                  align: 'start'
                }}
                options={DROPDOWN_OPTIONS}
                multiLanguage
                onClick={handleClick}
              >
                <Button.Link
                  size="sm"
                  className="text-secondary hover:text-primary data-[state=open]:bg-accent-light"
                  iconOnly
                >
                  <Tooltip label={t('form.menuTip')}>
                    <IconDots className="h-5 w-5" />
                  </Tooltip>
                </Button.Link>
              </Dropdown>
            </div>
          </Skeleton>

          <Skeleton className="[&_[data-slot=skeleton]]:w-64" loading={loading}>
            <div className="text-sm/6 text-secondary">
              <Trans
                t={t}
                i18nKey="form.metadata3"
                components={{
                  span: <span />
                }}
                values={{
                  status: t(`form.${status}`),
                  count: form?.submissionCount || 0,
                  date: timeFromNow(form?.updatedAt || 0, i18n.language)
                }}
              />
            </div>
          </Skeleton>
        </div>

        <div className="flex items-center gap-2 sm:flex-row">
          <Button.Copy
            size="md"
            className="order-last sm:order-first"
            text={`${sharingURLPrefix}/form/${formId}`}
            label={t('form.copyLinkToShare')}
            icon={<IconLink className="h-5 w-5" />}
          />

          {/* Go to form edit page */}
          <Button size="md" onClick={handleEdit}>
            {t('form.editForm')}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-5 overflow-x-auto">
        <div className="border-b border-accent-light">
          <nav className="flex items-center gap-6 text-sm font-medium text-secondary">
            {navigations.map(n => (
              <NavLink
                key={n.value}
                className={({ isActive }) =>
                  cn('text-nowrap py-3 hover:text-primary', {
                    'relative text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary':
                      isActive
                  })
                }
                to={n.to}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {children}
    </WorkspaceLayout>
  )
}
