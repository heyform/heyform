import type { FormModel } from '@heyform-inc/shared-types-enums'
import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import {
  IconClipboardCheck,
  IconCopy,
  IconDots,
  IconEdit,
  IconPencil,
  IconTrash
} from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as timeago from 'timeago.js'

import { Async } from '@/components'
import {
  Badge,
  Button,
  Dropdown,
  EmptyStates,
  Menus,
  Modal,
  Table,
  notification
} from '@/components/ui'
import { TableColumn } from '@/components/ui/table'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import { ProjectLayout } from '../views/ProjectLayout'
import { Skeleton } from '../views/Skeleton'
import './index.scss'
import { CreateForm } from './views/CreateForm'
import { RenameForm } from './views/RenameForm'

const Project = observer(() => {
  const navigate = useNavigate()
  const { workspaceId, projectId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const appStore = useStore('appStore')

  const [suspendModalVisible, openSuspendModal, closeSuspendModal] = useVisible()
  const [renameFormVisible, openRenameForm, closeRenameForm] = useVisible()
  const [form, setForm] = useState<FormModel>()
  const { t } = useTranslation()

  async function request() {
    const result = await FormService.forms(projectId, FormStatusEnum.NORMAL)
    workspaceStore.setForms(projectId, result)

    return helper.isValid(result)
  }

  function handleRowClick(record: FormModel) {
    if (record.suspended) {
      return openSuspendModal()
    }

    navigate(`/workspace/${record.teamId}/project/${record.projectId}/form/${record.id}/create`)
  }

  async function handleDuplicate(record: FormModel) {
    const loading = notification.loading({
      title: t('project.Duplicating')
    })

    try {
      const result = await FormService.duplicate(record.id)
      workspaceStore.addForm(projectId, {
        ...record,
        id: result
      })

      navigate(`/workspace/${workspaceId}/project/${projectId}/form/${result}/create`)
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    loading.dismiss()
  }

  function handleRename(record: FormModel) {
    setForm(record)
    openRenameForm()
  }

  async function handleDelete(record: FormModel) {
    const loading = notification.loading({
      title: t('project.Deleting')
    })

    try {
      await FormService.moveToTrash(record.id)
      workspaceStore.deleteForm(projectId, record.id)
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    loading.dismiss()
  }

  function handleCreateForm() {
    appStore.isCreateFormOpen = true
  }

  function handleConfirm() {
    window.location.href = 'https://heyform.net/f/E4MKK2hx'
  }

  // Table columns
  const columns: TableColumn<FormModel>[] = [
    {
      key: 'id',
      name: t('project.trash.FormName'),
      width: '40%',
      render(record) {
        return (
          <div>
            <p className="truncate text-sm font-semibold text-slate-800">{record.name}</p>
            <p className="mt-0.5 flex items-center text-sm font-normal text-slate-500">
              <span className="truncate">
                {record.submissionCount && record.submissionCount > 0
                  ? `${record.submissionCount} ${t('project.ProjectMembers.submissions')}`
                  : t('project.ProjectMembers.NoSubmissions')}
              </span>
            </p>
          </div>
        )
      }
    },
    {
      key: 'status',
      name: t('integration.Status'),
      width: '30%',
      render(record) {
        if (record.suspended) {
          return <Badge className="form-status" type="red" text={t('project.suspended')} dot />
        } else if (record.draft && !record.settings?.active) {
          return <Badge className="form-status" text={t('project.draft')} dot />
        } else if (record.settings?.active) {
          return <Badge className="form-status" type="green" text={t('project.active')} dot />
        } else {
          return <Badge className="form-status" text={t('project.closed')} dot />
        }
      }
    },
    {
      key: 'fieldUpdateAt',
      name: t('project.trash.LastUpdate'),
      width: '20%',
      render(record) {
        if (record.fieldUpdateAt) {
          return timeago.format(record.fieldUpdateAt * 1_000)
        }
      }
    },
    {
      key: 'action',
      name: t('workspace.members.Action'),
      align: 'right',
      render(record) {
        function handleClick(name?: IKeyType) {
          switch (name) {
            case 'edit':
              handleRowClick(record)
              break

            case 'rename':
              handleRename(record)
              break

            case 'duplicate':
              handleDuplicate(record)
              break

            case 'delete':
              handleDelete(record)
              break
          }
        }

        return (
          <Dropdown
            className="ml-1 cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            placement="bottom-end"
            overlay={
              <Menus onClick={handleClick}>
                <Menus.Item value="edit" icon={<IconEdit />} label={t('project.edit')} />
                <Menus.Item value="duplicate" icon={<IconCopy />} label={t('project.dup')} />
                <Menus.Item value="rename" icon={<IconPencil />} label={t('project.rename')} />
                <Menus.Item value="delete" icon={<IconTrash />} label={t('project.del')} />
              </Menus>
            }
          >
            <IconDots className="h-5 w-5" />
          </Dropdown>
        )
      }
    }
  ]

  return (
    <ProjectLayout>
      <Async
        request={request}
        deps={[projectId]}
        skeleton={<Skeleton />}
        emptyState={
          <EmptyStates
            className="empty-states-fit"
            icon={<IconClipboardCheck className="non-scaling-stroke" />}
            title={t('project.noForm')}
            description={t('project.text')}
            action={<Button onClick={handleCreateForm}>{t('project.create2')}</Button>}
          />
        }
      >
        <Table<FormModel>
          className="forms mt-8"
          columns={columns}
          data={workspaceStore.forms}
          onRowClick={handleRowClick}
        />
      </Async>

      <CreateForm />
      <RenameForm visible={renameFormVisible} form={form} onClose={closeRenameForm} />

      <Modal.Confirm
        type="danger"
        visible={suspendModalVisible}
        title={t('project.suspendForm')}
        description={t('project.suspendText')}
        cancelLabel={t('project.trash.cancel')}
        confirmLabel={t('project.contact')}
        onClose={closeSuspendModal}
        onCancel={closeSuspendModal}
        onConfirm={handleConfirm}
      />
    </ProjectLayout>
  )
})

export default Project
