import { IconChevronLeft } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import IconAI from '@/assets/ai.svg?react'
import { Button, Form, Input } from '@/components'
import { FormService } from '@/services'
import { useParam, useRouter } from '@/utils'

import { TemplatesModelProps } from './TemplatesModel'

export default function CreateWithAIModel({ onBack }: TemplatesModelProps) {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId, projectId } = useParam()
  const [rcForm] = Form.useForm()

  const examples = useMemo(
    () => Array.from({ length: 3 }).map((_, index) => t(`form.ai.topic.examples.${index}`)),
    [t]
  )

  async function fetch(values: any) {
    const formId = await FormService.createWithAI({
      projectId,
      ...values
    })

    router.push(`/workspace/${workspaceId}/project/${projectId}/form/${formId}/create`)
  }

  return (
    <div className="sm:w-[42rem]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="-ml-[0.15rem] inline-flex items-center gap-1 text-sm/6"
          onClick={onBack}
        >
          <IconChevronLeft className="h-5 w-5" />
          <span className="font-semibold">{t('form.creation.ai.headline')}</span>
        </button>
      </div>

      <Form.Simple
        className="mt-6 space-y-4"
        form={rcForm}
        submitProps={{
          className: 'px-5 min-w-24',
          size: 'md',
          label: t('form.ai.submit')
        }}
        fetch={fetch}
        refreshDeps={[workspaceId, projectId]}
      >
        <div className="space-y-2">
          <Form.Item
            name="topic"
            label={t('form.ai.topic.label')}
            description={t('form.ai.topic.description')}
            rules={[
              {
                required: true,
                message: t('form.ai.topic.required')
              }
            ]}
          >
            <Input.TextArea autoComplete="off" maxLength={200} />
          </Form.Item>

          <div>
            <p className="text-sm/6">{t('form.ai.topic.ideasForYou')}</p>
            <ul className="mt-1">
              {examples.map((row, index) => (
                <li key={index}>
                  <Button.Link
                    className="!h-auto w-full px-1.5 py-2 text-left sm:px-1.5 sm:py-1.5 [&_[data-slot=button]]:items-center [&_[data-slot=button]]:justify-start"
                    onClick={() => rcForm.setFieldValue('topic', row)}
                  >
                    <IconAI className="h-5 w-5" />
                    <span>{row}</span>
                  </Button.Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Form.Item
          name="reference"
          label={t('form.ai.reference.label')}
          description={t('form.ai.reference.description')}
        >
          <Input.TextArea autoComplete="off" rows={6} maxLength={2000} />
        </Form.Item>
      </Form.Simple>
    </div>
  )
}
