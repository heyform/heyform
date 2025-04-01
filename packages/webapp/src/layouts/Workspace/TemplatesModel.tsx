import { FormRenderer, insertWebFont } from '@heyform-inc/form-renderer'
import { slugify } from '@heyform-inc/utils'
import { IconChevronLeft, IconUpload } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Button, Image, Loader, Tabs, useToast } from '@/components'
import { TEMPLATE_CATEGORIES } from '@/consts'
import { insertThemeStyle } from '@/pages/form/Builder/utils'
import { FormService } from '@/services'
import { useAppStore } from '@/store'
import { TemplateGroupType, TemplateType } from '@/types'
import { cn, scrollIntoViewIfNeeded, useParam, useRouter } from '@/utils'

export interface TemplatesModelProps {
  onBack: () => void
}

interface TemplatePreviewProps extends TemplatesModelProps {
  template: TemplateType
}

const TemplatePreview: FC<TemplatePreviewProps> = ({ template: rawTemplate, onBack }) => {
  const { t, i18n } = useTranslation()

  const router = useRouter()
  const { workspaceId, projectId } = useParam()
  const { closeModal } = useAppStore()

  const [platform, setPlatform] = useState('mobile')
  const [template, setTemplate] = useState<TemplateType>()

  const tabs = useMemo(
    () => [
      {
        value: 'desktop',
        label: t('form.builder.preview.desktop')
      },
      {
        value: 'mobile',
        label: t('form.builder.preview.mobile')
      }
    ],
    [t]
  )

  const { loading, run } = useRequest(
    async () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const formId = await FormService.useTemplate({
        projectId,
        templateId: rawTemplate.id,
        recordId: rawTemplate.recordId as string
      })

      closeModal('CreateFormModal')
      router.push(`/workspace/${workspaceId}/project/${projectId}/form/${formId}/create`)
    },
    {
      refreshDeps: [rawTemplate.id],
      manual: true
    }
  )

  async function fetch() {
    const result = await FormService.templateDetail(rawTemplate.id)

    setTemplate({
      ...rawTemplate,
      ...result,
      settings: {
        active: true
      }
    })

    return true
  }

  useEffect(() => {
    insertWebFont(template?.themeSettings?.theme?.fontFamily)
    insertThemeStyle(template?.themeSettings?.theme)
  }, [template?.themeSettings?.theme])

  return (
    <div className="h-[calc(90vh-3.125rem)] w-[90vw]">
      <div className="flex h-full w-full flex-col">
        <div className="flex w-full items-center justify-between pb-4">
          <button
            type="button"
            className="-ml-[0.15rem] inline-flex items-center gap-1 text-sm/6"
            onClick={onBack}
          >
            <IconChevronLeft className="h-5 w-5" />
            <span className="font-semibold">{rawTemplate.name}</span>
          </button>

          <Tabs.SegmentedControl
            className="hidden sm:flex [&_[data-slot=nav]]:h-9 [&_[data-slot=tablist]_button]:py-0.5"
            tabs={tabs}
            defaultTab={platform}
            onChange={setPlatform}
          />

          <Button className="mr-8" size="md" loading={loading} onClick={run}>
            {t('form.template.use')}
          </Button>
        </div>

        <div className="w-full flex-1"></div>

        <Async
          fetch={fetch}
          refreshDeps={[rawTemplate]}
          loader={
            <div className="flex h-full w-full items-center justify-center">
              <Loader />
            </div>
          }
        >
          {template && (
            <div
              className={cn(
                'form-preview template-preview relative h-full w-full rounded-lg',
                `form-preview-${platform}`
              )}
            >
              <FormRenderer
                form={template as Any}
                autoSave={false}
                query={{}}
                locale={i18n.language}
                alwaysShowNextButton={true}
                enableQuestionList={true}
                enableNavigationArrows={true}
              />
            </div>
          )}
        </Async>
      </div>
    </div>
  )
}

export default function TemplatesModel({ onBack }: TemplatesModelProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { workspaceId, projectId } = useParam()
  const { closeModal } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const [templateGroups, setTemplateGroups] = useState<TemplateGroupType[]>([])
  const [template, setTemplate] = useState<TemplateType>()

  const { loading: importLoading, run: importForm } = useRequest(
    async (formJson: string) => {
      try {
        const result = await FormService.importFromJSON(projectId, formJson)
        closeModal('CreateFormModal')
        router.push(`/workspace/${workspaceId}/project/${projectId}/form/${result}/create`)
      } catch (error) {
        toast({
          title: t('components.error.title'),
          message: t(
            'form.template.importError',
            'Failed to import form. Please check the JSON format.'
          )
        })
      }
    },
    {
      manual: true
    }
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const json = e.target?.result as string
        // Validate JSON format before sending
        JSON.parse(json)
        importForm(json)
      } catch (error) {
        toast({
          title: t('components.error.title'),
          message: t('form.template.invalidJson', 'Invalid JSON format. Please check your file.')
        })
      }
    }
    reader.onerror = () => {
      toast({
        title: t('components.error.title'),
        message: t('form.template.fileReadError', 'Failed to read file. Please try again.')
      })
    }
    reader.readAsText(file)
  }

  async function fetch() {
    const result = await FormService.templates()

    setTemplateGroups(
      TEMPLATE_CATEGORIES.map((category, index) => ({
        id: slugify(category),
        category: t(`form.template.categories.${index}`),
        templates: result.filter(row => row.category === category)
      }))
    )

    return true
  }

  function handleScrollIntoView(id: string) {
    scrollIntoViewIfNeeded(
      document.getElementById('create-form-modal')!,
      document.getElementById(id)!
    )
  }

  if (template) {
    return <TemplatePreview template={template} onBack={() => setTemplate(undefined)} />
  }

  return (
    <div className="min-h-[calc(90vh-3.125rem)] w-[90vw]">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="-ml-[0.15rem] inline-flex items-center gap-1 text-sm/6"
            onClick={onBack}
          >
            <IconChevronLeft className="h-5 w-5" />
            <span className="font-semibold">{t('form.template.headline')}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-accent-light">
          {templateGroups.map(row => (
            <Button.Ghost key={row.id} size="sm" onClick={() => handleScrollIntoView(row.id)}>
              {row.category}
            </Button.Ghost>
          ))}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
            aria-label={t('form.template.importJson')}
          />
          <Button.Ghost
            size="sm"
            loading={importLoading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1"
          >
            <IconUpload className="h-4 w-4" />
            {t('form.template.importJson', 'Import from JSON')}
          </Button.Ghost>
        </div>
      </div>

      <Async
        fetch={fetch}
        loader={
          <div className="flex h-[calc(90vh-15rem)] items-center justify-center">
            <Loader />
          </div>
        }
      >
        <div className="[&>div:first-of-type]:pt-0">
          {templateGroups.map(row => (
            <div key={row.id} id={row.id} className="pt-10">
              <h3 className="text-balance text-sm/6 font-semibold text-primary">{row.category}</h3>
              <ul className="min-w-[1500px]:bg-red mt-2 grid grid-cols-5 gap-5">
                {row.templates.map(template => (
                  <li
                    key={template.id}
                    className="cursor-pointer rounded-lg border border-input"
                    onClick={() => setTemplate(template)}
                  >
                    <Image
                      className="aspect-video w-full rounded-t-lg"
                      src={(template as Any).thumbnail}
                      resize={{
                        width: 480,
                        height: 280
                      }}
                      loading="lazy"
                    />
                    <div className="p-2 text-sm/6 font-semibold">{template.name}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Async>
    </div>
  )
}
