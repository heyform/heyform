import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Form, PlanUpgrade, Select } from '@/components'
import { LOCALE_OPTIONS, PlanGradeEnum } from '@/consts'
import { useFormStore } from '@/store'

export default function FormSettingsTranslations() {
  const { t } = useTranslation()
  const { tempSettings } = useFormStore()

  const options = useMemo(
    () =>
      LOCALE_OPTIONS.map(l => ({
        value: l.value,
        label: (
          <div>
            <div className="text-sm/[1.4rem] font-medium text-primary" data-slot="label">
              {t(l.label)}
            </div>
            <div className="text-xs text-secondary" data-slot="translated">
              {t(l.translated)}
            </div>
          </div>
        ),
        ariaLabel: t(l.label)
      })),
    [t]
  )

  const restOptions = useMemo(
    () => options.filter(l => l.value !== tempSettings?.locale),
    [options, tempSettings?.locale]
  )

  return (
    <section id="translations" className="pt-10">
      <h2 className="text-lg font-semibold">{t('form.settings.translations.title')}</h2>

      <div className="mt-4 space-y-8">
        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5 [&_[data-slot=control]]:flex-col [&_[data-slot=control]]:sm:flex-row"
          name="locale"
          label={t('form.settings.translations.primaryLanguage.headline')}
          description={t('form.settings.translations.primaryLanguage.subHeadline')}
          isInline
        >
          <Select
            className="w-full min-w-40 sm:w-auto [&_[data-slot=translated]]:hidden"
            options={options}
          />
        </Form.Item>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="languages"
          label={
            <div className="flex items-start justify-between">
              <span>{t('form.settings.translations.translations.headline')}</span>
              <PlanUpgrade
                minimalGrade={PlanGradeEnum.PREMIUM}
                tooltipLabel={t('billing.upgrade.translations')}
              />
            </div>
          }
          description={
            <Trans
              t={t}
              i18nKey="form.settings.translations.translations.subHeadline"
              components={{
                a: (
                  <a
                    className="underline underline-offset-4 hover:text-primary"
                    href="https://openai.com/chatgpt"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                )
              }}
            />
          }
        >
          <PlanUpgrade minimalGrade={PlanGradeEnum.PREMIUM} isUpgradeShow={false}>
            <Select.Multi
              className="[&_[data-slot=label]]:hidden [&_[data-slot=translated]]:text-sm/[1.4rem] [&_[data-slot=translated]]:font-medium [&_[data-slot=translated]]:text-primary"
              options={restOptions}
              contentProps={{
                align: 'end'
              }}
              placeholder={t('form.settings.translations.translations.placeholder')}
            />
          </PlanUpgrade>
        </Form.Item>
      </div>
    </section>
  )
}
