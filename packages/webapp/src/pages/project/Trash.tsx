import type { FormModel } from '@heyform-inc/shared-types-enums'
import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconDots, IconTrash } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as timeago from 'timeago.js'

import { Async, RestoreIcon } from '@/components'
import { Badge, Dropdown, EmptyStates, Menus, Modal, Table, notification } from '@/components/ui'
import { TableColumn } from '@/components/ui/table'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import { ProjectLayout } from './views/ProjectLayout'
import { Skeleton } from './views/Skeleton'

const Trash = observer(() => {
  const { t } = useTranslation()
  const { projectId } = useParam()
  const workspaceStore = useStore('workspaceStore')

  const [loading, setLoading] = useState(false)
  const [deleteFormVisible, openDeleteForm, closeDeleteForm] = useVisible()

  const [forms, setForms] = useState<FormModel[]>([])
  const [form, setForm] = useState<FormModel | null>(null)

  async function request() {
    const result = await FormService.forms(projectId, FormStatusEnum.TRASH)
    setForms(result)

    return helper.isValid(result)
  }

  async function handleRestore(record: FormModel) {
    const l = notification.loading({
      title: t('project.trash.restoring')
    })

    try {
      await FormService.restoreForm(record.id)
      setForms(forms.filter(f => f.id !== record.id))
      workspaceStore.addForm(projectId, record)
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    l.dismiss()
  }

  async function handleDelete() {
    setLoading(true)

    try {
      await FormService.delete(form!.id)
      setForms(forms.filter(f => f.id !== form!.id))

      closeDeleteForm()
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    setLoading(false)
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
      render() {
        return <Badge className="form-status" text={t('project.closed')} dot />
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
            case 'restore':
              handleRestore(record)
              break

            case 'delete':
              setForm(record)
              openDeleteForm()
              break
          }
        }

        return (
          <Dropdown
            className="ml-1 cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            placement="bottom-start"
            overlay={
              <Menus onClick={handleClick}>
                <Menus.Item
                  value="restore"
                  icon={<RestoreIcon />}
                  label={t('project.trash.restore')}
                />
                <Menus.Item
                  value="delete"
                  icon={<IconTrash />}
                  label={t('project.trash.delForever')}
                />
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
      <div className="mt-8 text-sm text-slate-700">
        {t('project.trash.explain')}{' '}
        <a
          href="https://docs.heyform.net"
          target="_blank"
          className="text-blue-500 hover:text-blue-700"
        >
          {t('project.trash.link')}
        </a>
      </div>

      <Async
        request={request}
        deps={[projectId]}
        skeleton={<Skeleton />}
        emptyState={
          <EmptyStates
            className="empty-states-fit"
            icon={<IconTrash className="non-scaling-stroke" />}
            title={t('project.trash.noForm')}
            description={t('project.trash.daysExplain')}
          />
        }
      >
        <Table<FormModel> className="mt-8" columns={columns} data={forms} />
      </Async>

      <Modal.Confirm
        type="danger"
        visible={deleteFormVisible}
        title={t('project.trash.deleteForever')}
        description={`'${form?.name}' ${t('project.trash.delForm')}`}
        cancelLabel={t('project.trash.cancel')}
        confirmLabel={t('project.del')}
        confirmLoading={loading}
        onCancel={closeDeleteForm}
        onClose={closeDeleteForm}
        onConfirm={handleDelete}
      />
    </ProjectLayout>
  )
})

export default Trash
