import { useBoolean } from 'ahooks'
import { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Checkbox, Form, Input, Modal, Repeat, SimpleFormProps } from '@/components'
import { ProjectService, WorkspaceService } from '@/services'
import { useAppStore, useModal, useUserStore, useWorkspaceStore } from '@/store'
import { MemberType, ProjectType } from '@/types'
import { uniqueArray, useParam, useRouter } from '@/utils'

import { ProjectMemberItem } from '../Project/ProjectMemberItem'

const AddMembers: FC<{ value?: string[]; onChange?: (value: string[]) => void }> = ({
  value = [],
  onChange
}) => {
  const { workspaceId } = useParam()
  const { user } = useUserStore()
  const { workspace, members, setMembers } = useWorkspaceStore()

  async function fetch() {
    const result = (await WorkspaceService.members(workspaceId)).map((m: MemberType) => ({
      ...m,
      isOwner: workspace.ownerId === m.id,
      isYou: user.id === m.id
    }))

    setMembers(workspaceId, result)
    return true
  }

  const handleChange = useCallback(
    (isChecked: boolean, id: string) => {
      onChange?.(isChecked ? [...value, id] : value.filter(v => v !== id))
    },
    [onChange, value]
  )

  return (
    <div className="scrollbar -mx-6 max-h-[18rem] px-6">
      <div className="divide-y divide-accent-light">
        <Async
          fetch={fetch}
          refreshDeps={[workspaceId]}
          loader={
            <Repeat count={3}>
              <div className="flex items-center gap-4 py-4">
                <div className="skeleton h-10 w-10 rounded-full"></div>
                <div>
                  <div className="py-[0.1875rem]">
                    <div className="skeleton h-3.5 w-14 rounded-sm"></div>
                  </div>
                  <div className="py-[0.1875rem]">
                    <div className="skeleton h-3.5 w-36 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </Repeat>
          }
          cacheFirst={members.length > 0}
        >
          {members.map(m => (
            <ProjectMemberItem key={m.id} member={m}>
              <Checkbox
                value={value.includes(m.id)}
                disabled={m.isOwner || m.isYou}
                onChange={isChecked => handleChange(isChecked, m.id)}
              />
            </ProjectMemberItem>
          ))}
        </Async>
      </div>
    </div>
  )
}

const CreateProjectForm: FC<Pick<SimpleFormProps, 'onLoadingChange'>> = ({ onLoadingChange }) => {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId } = useParam()
  const { closeModal } = useAppStore()
  const { user } = useUserStore()
  const { workspace, addProject } = useWorkspaceStore()
  const { payload } = useModal('CreateProjectModal')

  async function fetch(values: ProjectType) {
    const result = await ProjectService.create(workspaceId, values.name, values.members)

    addProject(workspaceId, {
      ...values,
      id: result
    })

    closeModal('CreateProjectModal')

    if (payload?.callback) {
      payload.callback(result)
    } else {
      router.push(`/workspace/${workspaceId}/project/${result}/`)
    }
  }

  return (
    <Form.Simple
      className="space-y-4"
      fetch={fetch}
      initialValues={{
        members: uniqueArray([workspace.ownerId, user.id])
      }}
      submitProps={{
        className: 'px-5 min-w-24',
        size: 'md',
        label: t('components.continue')
      }}
      onLoadingChange={onLoadingChange}
    >
      <Form.Item
        name="name"
        label={t('project.creation.name.label')}
        rules={[
          {
            required: true,
            message: t('project.creation.name.required')
          }
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      <Form.Item name="members" label={t('project.creation.addMembers')}>
        <AddMembers />
      </Form.Item>
    </Form.Simple>
  )
}

export default function CreateProjectModal() {
  const { t } = useTranslation()

  const { isOpen, onOpenChange } = useModal('CreateProjectModal')
  const [loading, { set }] = useBoolean(false)

  return (
    <Modal.Simple
      open={isOpen}
      title={t('project.creation.headline')}
      description={t('project.creation.subHeadline')}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <CreateProjectForm onLoadingChange={set} />
    </Modal.Simple>
  )
}
