import { useTranslation } from 'react-i18next'

import { Form, Switch } from '@/components'

export default function FormSettingsEmailNotification() {
  const { t } = useTranslation()

  return (
    <section id="emailNotification" className="pt-10">
      <h2 className="text-lg font-semibold">{t('form.settings.emailNotification.title')}</h2>

      <div className="mt-4 space-y-8">
        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="enableEmailNotification"
          label={t('form.settings.emailNotification.self.headline')}
          description={t('form.settings.emailNotification.self.subHeadline')}
          isInline
        >
          <Switch />
        </Form.Item>

        {/*<div>*/}
        {/*  <Form.Item*/}
        {/*    className="[&_[data-slot=content]]:pt-1.5"*/}
        {/*    name="enableRespondentNotification"*/}
        {/*    label={t('form.settings.emailNotification.respondent.headline')}*/}
        {/*    description={t('form.settings.emailNotification.respondent.subHeadline')}*/}
        {/*    isInline*/}
        {/*  >*/}
        {/*    <Switch />*/}
        {/*  </Form.Item>*/}

        {/*  {tempSettings?.enableRespondentNotification && (*/}
        {/*    <>*/}
        {/*      <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="respondentEmails">*/}
        {/*        <Select*/}
        {/*          className="w-full"*/}
        {/*          items={[]}*/}
        {/*          placeholder={t('form.settings.emailNotification.respondent.emails')}*/}
        {/*        />*/}
        {/*      </Form.Item>*/}

        {/*      <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="respondentSubject">*/}
        {/*        <Input*/}
        {/*          className="w-full"*/}
        {/*          placeholder={t('form.settings.emailNotification.respondent.subject')}*/}
        {/*        />*/}
        {/*      </Form.Item>*/}

        {/*      <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="respondentSubject">*/}
        {/*        <Input*/}
        {/*          className="w-full"*/}
        {/*          placeholder={t('form.settings.emailNotification.respondent.fromName')}*/}
        {/*        />*/}
        {/*      </Form.Item>*/}

        {/*      <Form.Item className="[&_[data-slot=content]]:pt-1.5" name="respondentMessage">*/}
        {/*        <Input.TextArea*/}
        {/*          className="w-full"*/}
        {/*          rows={5}*/}
        {/*          placeholder={t('form.settings.emailNotification.respondent.message')}*/}
        {/*        />*/}
        {/*      </Form.Item>*/}
        {/*    </>*/}
        {/*  )}*/}
        {/*</div>*/}
      </div>
    </section>
  )
}
