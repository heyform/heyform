import { helper } from '@heyform-inc/utils'
import { IconPlus } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Loader, Select } from '@/components'
import { WEBSITE_URL } from '@/consts'
import { FormService } from '@/services'
import { useAppStore, useWorkspaceStore } from '@/store'
import { nextTick, useParam, useQuery, useRouter } from '@/utils'

export default function Template() {
  const { t } = useTranslation()

  const router = useRouter()
  const { templateId } = useParam()
  const { recordId } = useQuery()
  const [rcForm] = Form.useForm()
  const { openModal } = useAppStore()
  const { workspaces } = useWorkspaceStore()

  const [isLoaded, setIsLoaded] = useState(false)
  const [values, setValues] = useState<AnyMap>({
    workspaceId: workspaces[0]?.id,
    projectId: workspaces[0]?.projects[0]?.id
  })

  const projects = useMemo(() => {
    const workspace = workspaces.find(w => w.id === values.workspaceId)

    return workspace?.projects || []
  }, [values.workspaceId, workspaces])

  const CreateWorkspaceButton = useMemo(() => {
    if (workspaces.length > 0) {
      return null
    }

    return (
      <button
        type="button"
        tabIndex={-1}
        className="flex w-full items-center gap-x-2.5 rounded-lg py-2.5 pl-2 pr-3.5 text-base/6 text-primary outline-none hover:bg-accent-light sm:py-1.5 sm:pl-1.5 sm:pr-3 sm:text-sm/6"
        onClick={() => openModal('CreateWorkspaceModal')}
      >
        <IconPlus className="h-4 w-4" />
        <span>{t('template.use.createWorkspace')}</span>
      </button>
    )
  }, [workspaces.length])

  const { error, loading, run } = useRequest(
    async (values: AnyMap) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const formId = await FormService.useTemplate({
        projectId: values.projectId,
        templateId,
        recordId
      })

      router.push(
        `/workspace/${values.workspaceId}/project/${values.projectId}/form/${formId}/create`
      )
    },
    {
      refreshDeps: [templateId, recordId],
      manual: true
    }
  )

  function handleValuesChange(changes: AnyMap, allValues: AnyMap) {
    if (changes.workspaceId) {
      const workspace = workspaces.find(w => w.id === changes.workspaceId)

      if (helper.isValidArray(workspace?.projects)) {
        allValues.projectId = workspace!.projects[0]?.id
      }
    }

    setValues(allValues)
    nextTick(() => rcForm.resetFields())
  }

  function handleLoad() {
    setIsLoaded(true)
  }

  return (
    <div className="flex h-screen w-screen">
      <div className="scrollbar h-full w-full border-r border-accent-light bg-foreground px-4 py-6 sm:w-80">
        <div className="flex items-center justify-between">
          <h2 className="text-base/6 font-semibold">{t('template.use.title')}</h2>

          <Button.Link
            className="hidden items-center !p-0 text-secondary hover:bg-transparent hover:text-primary sm:flex"
            size="sm"
            onClick={() => router.push('/')}
          >
            {t('components.close')}
          </Button.Link>
        </div>

        <Form
          className="mt-2 space-y-4"
          initialValues={values}
          form={rcForm}
          onValuesChange={handleValuesChange}
          onFinish={run}
        >
          <Form.Item name="workspaceId" label={t('template.use.workspace')}>
            <Select
              className="w-full bg-foreground"
              options={workspaces}
              labelKey="name"
              valueKey="id"
              header={CreateWorkspaceButton}
              contentProps={{
                position: 'popper'
              }}
            />
          </Form.Item>

          <Form.Item name="projectId" label={t('template.use.project')}>
            <Select
              className="w-full bg-foreground"
              options={projects}
              labelKey="name"
              valueKey="id"
              contentProps={{
                position: 'popper'
              }}
            />
          </Form.Item>

          <Button type="submit" size="md" className="w-full" loading={loading}>
            {t('template.use.submit')}
          </Button>

          {error && !loading && <div className="text-sm/6 text-error">{error.message}</div>}
        </Form>
      </div>

      <div className="relative h-full flex-1">
        <iframe
          className="h-full w-full"
          src={`${WEBSITE_URL}/f/${templateId}`}
          onLoad={handleLoad}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}
