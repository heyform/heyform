import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import { IconCalendar, IconPrinter } from '@tabler/icons-react'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { formatDay, unixDate } from '@/utils'

import { Button, Modal, TableRef, TableState } from '@/components'
import { useModal } from '@/store'
import { SubmissionType } from '@/types'

import SubmissionCell, { SubmissionHeaderCell } from './SubmissionCell'

interface SubmissionItemProps {
  submission: SubmissionType
  field: FormField
}

interface SubmissionDetailPayload extends TableState {
  ref: TableRef<Any>
  submission: SubmissionType
  fields: FormField[]
}

interface SubmissionDetailProps {
  onClose: () => void
}

const SubmissionItem: FC<SubmissionItemProps> = ({ submission, field }) => {
  const answer = submission.answers.find(answer => answer.id === field.id)

  return (
    <div className="grid grid-cols-1 gap-5 pt-4 text-sm/6 sm:grid-cols-[min(50%,theme(spacing.80))_auto]">
      <SubmissionHeaderCell
        className="text-secondary items-start gap-x-2 [&_[data-slot=icon]]:h-5 [&_[data-slot=icon]]:w-5 [&_[data-slot=label]]:text-wrap [&_[data-slot=question-icon]]:h-6 [&_[data-slot=question-icon]]:w-6"
        field={field}
      />
      <div className="min-w-0 flex-1">
        {answer && <SubmissionCell field={field} submission={submission} answer={answer} />}
      </div>
    </div>
  )
}

const SubmissionDetail: FC<SubmissionDetailProps> = () => {
  const { t, i18n } = useTranslation()
  const { payload } = useModal<SubmissionDetailPayload>('SubmissionDetailModal')

  const fields = useMemo(
    () => (payload?.fields || []).filter(f => f.kind !== FieldKindEnum.SUBMIT_DATE),
    [payload?.fields]
  )

  const submitDate = useMemo(() => {
    if (payload?.fields && payload?.submission) {
      const value = payload.submission.answers.find(answer => answer.id === 'submit_date')?.value

      if (value) {
        return formatDay(unixDate(value), i18n.language)
      }
    }
  }, [i18n.language, payload?.fields, payload?.submission])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end px-6 pb-2 pt-6">
        <div className="flex-1">
          <h1 className="text-primary text-2xl/8 font-semibold sm:text-xl/8">
            {t('form.submissions.detail.headline')}
          </h1>

          <div className="mt-2 flex flex-wrap gap-4">
            <span className="text-primary flex items-center gap-3 text-base/6 sm:text-sm/6">
              <IconCalendar className="text-secondary h-4 w-4" />
              <span>{submitDate}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2 print:opacity-0">
          {/*<Button.Ghost*/}
          {/*  size="sm"*/}
          {/*  disabled={payload?.loading || payload?.isPreviousDisabled}*/}
          {/*  iconOnly*/}
          {/*  onClick={payload?.ref?.toPrevious}*/}
          {/*>*/}
          {/*  <IconChevronUp className="h-5 w-5" />*/}
          {/*</Button.Ghost>*/}

          {/*<Button.Ghost*/}
          {/*  size="sm"*/}
          {/*  disabled={payload?.loading || payload?.isNextDisabled}*/}
          {/*  iconOnly*/}
          {/*  onClick={payload?.ref?.toNext}*/}
          {/*>*/}
          {/*  <IconChevronDown className="h-5 w-5" />*/}
          {/*</Button.Ghost>*/}

          <Button.Ghost size="sm" onClick={handlePrint}>
            <IconPrinter className="h-5 w-5" />
            <span>{t('components.print')}</span>
          </Button.Ghost>
        </div>
      </div>

      <div className="scrollbar flex-1 overflow-y-auto px-6 pb-6">
        <div className="divide-accent-light space-y-4 divide-y">
          {fields.map(field => (
            <SubmissionItem key={field.id} submission={payload?.submission} field={field} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SubmissionDetailModal({ onClose }: SubmissionDetailProps) {
  const { isOpen } = useModal('SubmissionDetailModal')

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose?.()
    }
  }

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-6xl h-[80vh] !p-0'
      }}
      onOpenChange={handleOpenChange}
    >
      <SubmissionDetail onClose={() => handleOpenChange(false)} />
    </Modal>
  )
}
