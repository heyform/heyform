import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Form, Switch } from '@/components'
import { FormService } from '@/services'
import { useFormStore } from '@/store'
import { downloadJson, useApiError, useParam } from '@/utils'

export default function FormSettingsGeneral() {
  const { t } = useTranslation()
  const { formId } = useParam()
  const { form } = useFormStore()
  const { handleApiError } = useApiError()

  // const { run: handleNameChange } = useRequest(
  //   async (name: string) => {
  //     updateForm(formId, { name })
  //     await FormService.update(formId, { name })
  //   },
  //   {
  //     debounceWait: 300,
  //     manual: true,
  //     refreshDeps: [formId]
  //   }
  // )

  const { run: exportForm, loading: exporting } = useRequest(
    async () => {
      try {
        const formData = await FormService.exportToJSON(formId)
        downloadJson(formData, `${form?.name || 'form'}.json`)
      } catch (error) {
        handleApiError(error as Error)
      }
    },
    {
      manual: true
    }
  )

  return (
    <section id="general">
      <h2 className="text-lg font-semibold">{t('form.settings.general.title')}</h2>

      <div className="mt-4 space-y-8">
        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="allowArchive"
          label={t('form.settings.general.archive.headline')}
          description={t('form.settings.general.archive.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        {/* <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="redirectOnCompletion"
            label={t('form.settings.general.redirect.headline')}
            description={t('form.settings.general.redirect.subHeadline')}
            isInline
          >
            <Switch />
          </Form.Item>

          {tempSettings?.redirectOnCompletion && (
            <Form.Item
              className="[&_[data-slot=content]]:pt-1.5"
              name="redirectUrl"
              rules={[
                {
                  type: 'url',
                  message: t('form.settings.general.redirect.invalidUrl')
                }
              ]}
            >
              <Input
                className="w-full"
                placeholder={t('form.settings.general.redirect.placeholder')}
              />
            </Form.Item>
          )}
        </div> */}

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="enableProgress"
          label={t('form.settings.general.progressBar.headline')}
          description={t('form.settings.general.progressBar.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="enableQuestionList"
          label={t('form.settings.general.viewQuestions.headline')}
          description={t('form.settings.general.viewQuestions.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="enableNavigationArrows"
          label={t('form.settings.general.navigationArrows.headline')}
          description={t('form.settings.general.navigationArrows.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-6 text-gray-900">
            {t('settings.form.exportImport', 'Export/Import')}
          </h3>
          <p className="text-sm text-secondary">
            {t(
              'settings.form.exportImportDescription',
              'Export this form as a JSON file or import a JSON file to create a new form.'
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="hover:bg-primary-500 focus-visible:outline-primary-600 inline-flex items-center rounded-md !bg-white bg-primary px-3 py-2 text-sm font-semibold !text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={exportForm}
              disabled={exporting}
            >
              {t('settings.form.exportJson', 'Export as JSON')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
