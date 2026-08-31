import { useTranslation } from 'react-i18next'

import { Form, Switch } from '@/components'

export default function FormSettingsGeneral() {
  const { t } = useTranslation()

  return (
    <section id="general">
      <h2 className="hf-section-title">{t('form.settings.general.title')}</h2>

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

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="generatePseudonymId"
          label={t('form.settings.general.pseudonymId.headline')}
          description={t('form.settings.general.pseudonymId.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

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
      </div>
    </section>
  )
}
