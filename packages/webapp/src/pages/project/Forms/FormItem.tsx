import {
  IconCopy,
  IconDots,
  IconPencil,
  IconRestore,
  IconShare,
  IconTag,
  IconTrash
} from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, MouseEvent, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import IconLink from '@/assets/link.svg?react'
import IconMoveTo from '@/assets/move-to.svg?react'
import { Badge, Button, Dropdown, Tooltip, useAlert, usePrompt } from '@/components'
import { FormService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { FormType } from '@/types'
import { timeFromNow, timeToNow, useRouter } from '@/utils'

interface FormItemLinkProps extends ComponentProps {
  to: string
  isInTrash?: boolean
  isSuspended?: boolean
}

const FormStatus: FC<{ form?: FormType }> = ({ form }) => {
  const { t } = useTranslation()

  if (!form) {
    return null
  } else if (form.suspended) {
    return <Badge color="red">{t('form.suspended')}</Badge>
  } else if (form.isDraft) {
    return <Badge color="zinc">{t('form.draft')}</Badge>
  } else if (form.settings?.active) {
    return <Badge color="green">{t('form.active')}</Badge>
  } else {
    return <Badge color="zinc">{t('form.closed')}</Badge>
  }
}

const FormItemLink: FC<FormItemLinkProps> = ({
  to,
  isInTrash = false,
  isSuspended = false,
  children,
  ...restProps
}) => {
  const { t } = useTranslation()
  const alert = useAlert()

  function handleSuspend() {
    alert({
      title: t('form.suspend.headline'),
      description: t('form.suspend.subHeadline'),
      confirmProps: {
        label: t('form.suspend.contactUs')
      },
      onConfirm() {
        window.location.href = 'https://heyform.net/f/E4MKK2hx'
      }
    })
  }

  if (isSuspended) {
    return (
      <div {...restProps} onClick={handleSuspend}>
        {children}
      </div>
    )
  } else if (isInTrash) {
    return <div {...restProps}>{children}</div>
  } else {
    return (
      <Link to={to} {...restProps}>
        {children}
      </Link>
    )
  }
}

interface FormItemProps {
  form: FormType
  isInTrash?: boolean
  onChange?: (type: 'rename' | 'trash' | 'restore' | 'delete' | 'move', form: FormType) => void
}

const FormItem: FC<FormItemProps> = ({ form, isInTrash, onChange }) => {
  const { t, i18n } = useTranslation()

  const alert = useAlert()
  const prompt = usePrompt()
  const router = useRouter()
  const { workspace, sharingURLPrefix } = useWorkspaceStore()

  const options = useMemo(
    () =>
      isInTrash
        ? [
            {
              value: 'restore',
              icon: <IconRestore className="h-4 w-4" />,
              label: 'components.restore'
            },
            {
              value: 'delete',
              icon: <IconTrash className="h-4 w-4" />,
              label: 'components.permanentlyDelete'
            }
          ]
        : [
            {
              value: 'edit',
              icon: <IconPencil className="h-4 w-4" />,
              label: 'components.edit'
            },
            {
              value: 'rename',
              icon: <IconTag className="h-4 w-4" />,
              label: 'components.rename'
            },
            {
              value: 'share',
              icon: <IconShare className="h-4 w-4" />,
              label: 'components.share'
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
          ],
    [isInTrash]
  )

  function handleEdit(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault()
    router.push(`/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/create`)
  }

  function handleShare(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault()
    router.push(`/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/share`)
  }

  const { runAsync: handleDuplicate } = useRequest(
    async () => {
      const name = t('form.duplicate', { name: form.name })
      const id = await FormService.duplicate(form.id, name)

      router.push(`/workspace/${form.teamId}/project/${form.projectId}/form/${id}/create`)
    },
    {
      refreshDeps: [form],
      manual: true
    }
  )

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
        await FormService.update(form.id, values)

        onChange?.('rename', {
          ...form,
          ...values
        })
      }
    })
  }

  function handleMoveTo() {
    prompt({
      value: {
        projectId: form.projectId
      },
      title: t('project.moveto.headline', { name: form.name }),
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
        const result = await FormService.moveToProject(form.id, values.projectId)

        if (result) {
          router.replace(
            `/workspace/${form.teamId}/project/${values.projectId}/form/${form.id}/analytics`
          )
        }
      }
    })
  }

  const { runAsync } = useRequest(
    async (type: string) => {
      switch (type) {
        case 'trash':
          await FormService.moveToTrash(form.id)
          onChange?.(type, form)
          break

        case 'restore':
          await FormService.restoreForm(form.id)
          onChange?.(type, form)
          break

        case 'delete':
          alert({
            title: t('project.trash.delete.headline', { name: form.name }),
            description: t('project.trash.delete.subHeadline'),
            cancelProps: {
              label: t('components.cancel')
            },
            confirmProps: {
              label: t('components.delete'),
              className: 'bg-error text-primary-light dark:text-primary hover:bg-error'
            },
            fetch: async () => {
              await FormService.delete(form.id)
              onChange?.(type, form)
            }
          })
          break
      }
    },
    {
      refreshDeps: [form],
      manual: true
    }
  )

  async function handleClick(value: string) {
    switch (value) {
      case 'edit':
        return handleEdit()

      case 'share':
        return handleShare()

      case 'rename':
        return handleRename()

      case 'duplicate':
        return handleDuplicate()

      case 'moveto':
        return handleMoveTo()

      case 'trash':
      case 'restore':
      case 'delete':
        return runAsync(value)
    }
  }

  return (
    <FormItemLink
      className="group flex items-center justify-between gap-6 py-4 first-of-type:border-t first-of-type:border-accent-light last-of-type:border-b last-of-type:border-accent-light hover:bg-secondary-light has-[[data-state=open]]:bg-secondary-light"
      to={`/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/analytics`}
      isInTrash={isInTrash}
      isSuspended={form.suspended}
    >
      <div className="flex-1 pl-2">
        <div className="text-sm/6 font-medium">{form.name}</div>
        <div className="text-sm/6 text-secondary">
          {isInTrash
            ? t('form.metadata2', {
                count: form.submissionCount,
                date: timeToNow(form.retentionAt, i18n.language)
              })
            : t('form.metadata', {
                count: form.submissionCount,
                date: timeFromNow(form.updatedAt, i18n.language)
              })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!isInTrash && !form.suspended && (
          <div className="flex _hidden items-center group-hover:block">
            <Tooltip label={t('components.edit')}>
              <Button.Link size="sm" iconOnly onClick={handleEdit}>
                <IconPencil className="h-5 w-5" />
              </Button.Link>
            </Tooltip>

            <Button.Copy
              size="sm"
              className="order-last text-primary sm:order-first [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]"
              text={`${sharingURLPrefix}/form/${form.id}`}
              label={t('form.copyLinkToShare')}
              icon={<IconLink strokeWidth={2.2} />}
            />
          </div>
        )}

        <FormStatus form={form} />

        {!form.suspended && (
          <Dropdown
            contentProps={{
              className:
                'min-w-36 [&_[data-value=delete]]:text-error [&_[data-value=trash]]:text-error',
              side: 'bottom',
              sideOffset: 8,
              align: 'end'
            }}
            options={options}
            multiLanguage
            onClick={handleClick}
          >
            <Button.Link size="sm" className="data-[state=open]:bg-accent-light" iconOnly>
              <Tooltip label={t('form.menuTip')}>
                <IconDots className="h-4 w-4" />
              </Tooltip>
            </Button.Link>
          </Dropdown>
        )}
      </div>
    </FormItemLink>
  )
}

const Skeleton = () => {
  return (
    <div className="group flex items-center justify-between gap-6 py-4 first-of-type:border-t first-of-type:border-accent-light last-of-type:border-b last-of-type:border-accent-light">
      <div className="flex-1">
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-24 rounded-sm"></div>
        </div>
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-52 rounded-sm"></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-5 w-24 rounded-sm"></div>
      </div>
    </div>
  )
}

export default Object.assign(FormItem, {
  Skeleton
})
