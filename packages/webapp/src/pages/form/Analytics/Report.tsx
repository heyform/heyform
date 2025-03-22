import { flattenFields, htmlUtils } from '@heyform-inc/answer-utils'
import {
  CHOICES_FIELD_KINDS,
  FieldKindEnum,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper, pickValidValues } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Button, EmptyState, PlanUpgrade, Repeat } from '@/components'
import { PlanGradeEnum } from '@/consts'
import { FormService } from '@/services'
import { useAppStore, useFormStore } from '@/store'
import { useParam } from '@/utils'

import FormReportItem from './ReportItem'

interface ReportListProps {
  isHideFieldEnabled?: boolean
}

export const ReportList: FC<ReportListProps> = ({ isHideFieldEnabled }) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { form } = useFormStore()

  const [responses, setResponses] = useState<Any[]>([])

  const fetch = useCallback(async () => {
    const result = await FormService.report(formId)

    const fields = flattenFields(form?.drafts).filter(field =>
      QUESTION_FIELD_KINDS.includes(field.kind)
    )

    if (helper.isValidArray(fields)) {
      const choiceKinds = [FieldKindEnum.YES_NO, ...CHOICES_FIELD_KINDS]

      const responses = fields!.map(field => {
        let row = result.responses.find((row: any) => row.id === field.id)

        if (row) {
          row.answers = result.submissions.find((row: any) => row._id === field.id)?.answers

          if (choiceKinds.includes(field.kind)) {
            row.chooses = field.properties?.choices?.map(choice => {
              const choose = row.chooses.find((row: any) => row.id === choice.id)

              return {
                ...choose,
                ...choice
              }
            })
          }

          if (helper.isEmpty(row.chooses)) {
            row.chooses = []
          }
        } else {
          row = {
            id: field.id,
            chooses: [],
            total: 0,
            count: 0,
            average: 0
          }
        }

        row.title = helper.isArray(field.title)
          ? htmlUtils.plain(htmlUtils.serialize(field.title as Any))
          : field.title
        row.kind = field.kind
        row.properties = pickValidValues((field.properties as Any) || {}, [
          'tableColumns',
          'total',
          'average',
          'leftLabel',
          'rightLabel'
        ])

        return row
      })

      setResponses(responses)
      return responses.length > 0
    }

    return false
  }, [form?.drafts, formId])

  return (
    <Async
      fetch={fetch}
      loader={
        <div className="mt-4 space-y-6">
          <Repeat count={3}>
            <FormReportItem.Skeleton />
          </Repeat>
        </div>
      }
      refreshDeps={[form?.drafts, formId]}
    >
      {isHideFieldEnabled && (
        <>
          <h2 className="heyform-report-heading">{form?.name}</h2>
          <p className="heyform-report-subheading">
            {t('form.customReport.metadata', { count: form?.submissionCount || 0 })}
          </p>
        </>
      )}

      <ol className="heyform-report-items mt-4 space-y-8">
        {responses.map((row, index) => (
          <FormReportItem
            key={index}
            index={index + 1}
            response={row}
            isHideFieldEnabled={isHideFieldEnabled}
          />
        ))}
      </ol>
    </Async>
  )
}

export default function FormAnalyticsReport() {
  const { t } = useTranslation()

  const { openModal } = useAppStore()
  const { form, updateForm } = useFormStore()

  const { loading, run } = useRequest(
    async () => {
      if (!form?.id) {
        return
      }

      if (helper.isEmpty(form.customReport)) {
        const result = await FormService.createCustomReport(form!.id)

        updateForm({
          customReport: {
            id: result,
            hiddenFields: [],
            theme: {},
            enablePublicAccess: true
          }
        })
      }

      openModal('CustomReportModal')
    },
    {
      refreshDeps: [form?.customReport, form?.id],
      manual: true
    }
  )

  return (
    <>
      <div className="mt-14 flex items-center justify-between">
        <h2 className="text-base/6 font-semibold">{t('form.analytics.report.headline')}</h2>

        <PlanUpgrade
          minimalGrade={PlanGradeEnum.BASIC}
          isUpgradeShow={false}
          fallback={openUpgradeModal => (
            <Button size="md" onClick={openUpgradeModal}>
              {t('form.customReport.title')}
            </Button>
          )}
        >
          <Button size="md" loading={loading} onClick={run}>
            {t('form.customReport.title')}
          </Button>
        </PlanUpgrade>
      </div>

      <PlanUpgrade
        minimalGrade={PlanGradeEnum.BASIC}
        isUpgradeShow={false}
        fallback={openUpgradeModal => (
          <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-accent-light py-36 shadow-sm">
            <EmptyState
              headline={t('billing.upgrade.report')}
              buttonTitle={t('billing.upgrade.title')}
              onClick={openUpgradeModal}
            />
          </div>
        )}
      >
        <div className="heyform-report">
          <ReportList />
        </div>
      </PlanUpgrade>
    </>
  )
}
