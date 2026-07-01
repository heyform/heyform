import { Answer, Choice, Column, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { IconArrowUpRight, IconCheck, IconClock, IconFile } from '@tabler/icons-react'
import Big from 'big.js'
import { FC, Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn, formatDay, unixDate } from '@/utils'
import { CURRENCY_SYMBOLS, htmlUtils } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

import { Badge, Checkbox, Image, Lightbox } from '@/components'
import { ALL_FIELD_CONFIGS, CUSTOM_FIELDS_CONFIGS } from '@/consts'
import { FormFieldType, SubmissionType } from '@/types'

import { QuestionIcon } from '../Builder/LeftSidebar/QuestionList'

interface SubmissionHeaderCellProps {
  field: FormFieldType
}

interface SubmissionCellProps extends SubmissionHeaderCellProps {
  submission: SubmissionType
  answer: Answer
  isTableCell?: boolean
}

const ICON_CONFIGS = [...ALL_FIELD_CONFIGS, ...CUSTOM_FIELDS_CONFIGS]

const AddressItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  const { t } = useTranslation()

  if (answer.kind !== field.kind || !helper.isObject(answer.value)) {
    return null
  }

  const value = [
    answer.value.address1,
    answer.value.address2,
    answer.value.city,
    answer.value.state,
    answer.value.zip
  ]

  if (isTableCell) {
    return <span className="text-nowrap">{value.filter(helper.isValid).join(', ')}</span>
  }

  const labels = [
    t('form.submissions.address.address1'),
    t('form.submissions.address.address2'),
    t('form.submissions.address.city'),
    t('form.submissions.address.state'),
    t('form.submissions.address.zip')
  ]

  const result = value
    .map((row, index) => {
      if (helper.isValid(row)) {
        return {
          value: row,
          label: labels[index]
        }
      }
    })
    .filter(Boolean) as AnyMap[]

  return (
    <dl className="grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,theme(spacing.80))_auto] sm:text-sm/6">
      {result.map((row, index) => (
        <Fragment key={index}>
          <dt className="border-accent-light text-secondary sm:border-accent-light col-start-1 border-t pt-3 first:border-none sm:border-t sm:py-3">
            {row.label}
          </dt>
          <dd className="sm:[&amp;:nth-child(2)]:border-none text-primary sm:border-accent-light pb-3 pt-1 sm:border-t sm:py-3">
            {row.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  )
}

const DateRangeItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (answer.kind !== field.kind || !helper.isObject(answer.value)) {
    return null
  }

  return (
    <div
      className={cn({
        truncate: isTableCell
      })}
    >
      {[answer.value.start, answer.value.end].filter(Boolean).join(' - ')}
    </div>
  )
}

const FileUploadItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (answer.kind !== field.kind || !helper.isObject(answer.value)) {
    return null
  }

  const filename = encodeURIComponent(answer.value.filename)
  const downloadUrl = `${answer.value.cdnUrlPrefix}/${answer.value.cdnKey}?attname=${filename}`
  const fileUrl = `${answer.value.cdnUrlPrefix}/${answer.value.cdnKey}`
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(answer.value.filename || '')

  const [lightboxVisible, setLightboxVisible] = useState(false)

  if (isTableCell) {
    return (
      <div className="flex gap-1">
        <IconFile className="text-secondary h-5 w-5" />
        <div className="flex-1 truncate">{answer.value.filename}</div>
      </div>
    )
  }

  if (isImage) {
    return (
      <div className="space-y-2">
        <img
          src={fileUrl}
          alt={answer.value.filename}
          className="max-h-[90px] max-w-[120px] cursor-pointer rounded-lg object-cover shadow-sm hover:opacity-90 transition-opacity"
          onClick={() => setLightboxVisible(true)}
        />
        <div className="flex gap-3 text-xs">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand font-medium hover:underline"
          >
            View
          </a>
          <a
            href={downloadUrl}
            download={answer.value.filename}
            className="text-secondary font-medium hover:text-primary hover:underline"
          >
            Download
          </a>
        </div>
        <Lightbox
          visible={lightboxVisible}
          src={fileUrl}
          onClose={() => setLightboxVisible(false)}
        />
      </div>
    )
  }

  return (
    <a
      className="inline-flex gap-1 text-nowrap"
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
    >
      <IconFile className="text-secondary h-5 w-5" />
      <div className="flex-1 whitespace-nowrap">{answer.value.filename}</div>
    </a>
  )
}

const FullNameItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (answer.kind !== field.kind || !helper.isObject(answer.value)) {
    return null
  }

  return (
    <div
      className={cn({
        truncate: isTableCell
      })}
    >
      {[answer.value.firstName, answer.value.lastName].filter(Boolean).join(' ')}
    </div>
  )
}

const InputTableItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  const columns = field.properties?.tableColumns as Column[]

  if (
    answer.kind !== field.kind ||
    !helper.isValidArray(columns) ||
    !helper.isValidArray(answer.value)
  ) {
    return null
  }

  const result = answer.value
    .map((row: AnyMap) => {
      if (helper.isObject(row)) {
        return columns.map(c => row[c.id])
      }
    })
    .filter(Boolean) as string[][]

  if (isTableCell) {
    return (
      <div className="truncate">
        {result
          .filter(helper.isValidArray)
          .map(row => row.join(', '))
          .join('|')}
      </div>
    )
  }

  return (
    <div className="scrollbar overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-secondary">
          <tr className="border-accent border-b">
            {columns.map(c => (
              <th key={c.id} className="text-nowrap py-2 text-left font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.map((row, index) => (
            <tr
              key={index}
              className="border-accent hover:bg-primary/[2.5%] border-b last:border-b-0"
            >
              {row.map((cell, index) => (
                <td key={index} className="h-10 text-nowrap py-2 text-left">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const MultipleChoiceItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  const choices = field.properties?.choices as Choice[]

  if (
    answer.kind !== field.kind ||
    !helper.isValidArray(choices) ||
    !helper.isObject(answer.value) ||
    (!helper.isValidArray(answer.value.value) && helper.isEmpty(answer.value.other))
  ) {
    return null
  }

  const result = choices.filter(c => answer.value.value.includes(c.id))

  if (answer.value.other) {
    result.push({
      id: answer.value.other,
      label: answer.value.other
    })
  }

  return (
    <div className={cn('flex', isTableCell ? 'gap-x-2 overflow-hidden py-2' : 'flex-wrap gap-2')}>
      {result.map(row => (
        <Badge
          key={row.id}
          color="zinc"
          className={cn('text-primary', {
            'text-nowrap': isTableCell
          })}
        >
          {row.label}
        </Badge>
      ))}
    </div>
  )
}

const YesNoItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  const choices = field.properties?.choices as Choice[]

  if (answer.kind !== field.kind || !helper.isValidArray(choices)) {
    return null
  }

  const value = helper.isObject(answer.value) ? answer.value.value : answer.value
  const selected = choices.find(c => c.id === value)

  if (!selected) {
    return null
  }

  return (
    <div className={cn('flex', isTableCell ? 'gap-x-2 overflow-hidden py-2' : 'flex-wrap gap-2')}>
      <Badge
        color="zinc"
        className={cn('text-primary', {
          'text-nowrap': isTableCell
        })}
      >
        {selected.label}
      </Badge>
    </div>
  )
}

const OpinionScaleItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (answer.kind !== field.kind || !helper.isNumeric(answer.value)) {
    return null
  }

  const total = field.properties?.total ?? (field.kind === FieldKindEnum.RATING ? 5 : 10)

  return (
    <div
      className={cn({
        truncate: isTableCell
      })}
    >
      {answer.value}/{total}
    </div>
  )
}

const PaymentItem: FC<SubmissionCellProps> = ({ answer, field }) => {
  if (answer.kind !== field.kind || !helper.isObject(answer.value)) {
    return null
  }

  const amount = answer.value.amount || 0
  const amountString = CURRENCY_SYMBOLS[answer.value.currency] + Big(amount).div(100).toFixed(2)
  const isCompleted = helper.isValid(answer.value.paymentIntentId)

  return (
    <div className="flex items-center">
      <div className="flex flex-1 items-center overflow-hidden truncate">
        {isCompleted ? (
          <div className="flex h-6 items-center rounded bg-green-100 pl-1 pr-2 text-sm text-green-800">
            <IconCheck className="h-4 w-4" />
            <span className="ml-1">Succeeded</span>
          </div>
        ) : (
          <div className="text-primary flex h-6 items-center rounded bg-gray-100 pl-1 pr-2 text-sm">
            <IconClock className="h-4 w-4" />
            <span className="ml-1">Incomplete</span>
          </div>
        )}
        <div className="ml-2">{amountString}</div>
      </div>

      {isCompleted && (
        <div className="ml-2">
          <a href={answer.value.receiptUrl} target="_blank" rel="noreferrer">
            <IconArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}

const SignatureItem: FC<SubmissionCellProps> = ({ answer, field }) => {
  if (answer.kind !== field.kind || !helper.isURL(answer.value)) {
    return null
  }

  return <Image src={answer.value} width={80} height={40} />
}

const TextItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (
    answer.kind !== field.kind ||
    !(helper.isString(answer.value) || helper.isNumber(answer.value))
  ) {
    return null
  }

  return <div className={cn(isTableCell ? 'truncate' : 'whitespace-pre-line')}>{answer.value}</div>
}

const URLItem: FC<SubmissionCellProps> = ({ answer, field, isTableCell }) => {
  if (answer.kind !== field.kind || !helper.isString(answer.value)) {
    return null
  }

  if (isTableCell) {
    return <div className="truncate">{answer.value}</div>
  }

  return (
    <a href={answer.value} target="_blank" rel="noreferrer">
      {answer.value}
    </a>
  )
}

const SubmitDateItem: FC<SubmissionCellProps> = ({ answer }) => {
  const { i18n } = useTranslation()

  return <div className="truncate">{formatDay(unixDate(answer.value), i18n.language)}</div>
}

const CheckboxItem: FC<SubmissionCellProps> = ({ submission }) => {
  return (
    <div className="flex items-center" data-id={submission.id}>
      <Checkbox onChange={console.log} />
    </div>
  )
}

export default function SubmissionCell(props: SubmissionCellProps) {
  switch (props.field.kind) {
    case FieldKindEnum.HIDDEN_CHECKBOX:
      return <CheckboxItem {...props} />

    case FieldKindEnum.SUBMIT_DATE:
      return <SubmitDateItem {...props} />

    case FieldKindEnum.URL:
      return <URLItem {...props} />

    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      return <MultipleChoiceItem {...props} />

    case FieldKindEnum.YES_NO:
      return <YesNoItem {...props} />

    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      return <OpinionScaleItem {...props} />

    case FieldKindEnum.FILE_UPLOAD:
      return <FileUploadItem {...props} />

    case FieldKindEnum.SIGNATURE:
      return <SignatureItem {...props} />

    case FieldKindEnum.ADDRESS:
      return <AddressItem {...props} />

    case FieldKindEnum.FULL_NAME:
      return <FullNameItem {...props} />

    case FieldKindEnum.DATE_RANGE:
      return <DateRangeItem {...props} />

    case FieldKindEnum.INPUT_TABLE:
      return <InputTableItem {...props} />

    case FieldKindEnum.PAYMENT:
      return <PaymentItem {...props} />

    default:
      return <TextItem {...props} />
  }
}

export const SubmissionHeaderCell: FC<SubmissionHeaderCellProps & ComponentProps> = ({
  className,
  field
}) => {
  const label = helper.isArray(field.title)
    ? htmlUtils.plain(htmlUtils.serialize(field.title))
    : field.title

  return (
    <div className={cn('flex items-center gap-x-1.5', className)}>
      <QuestionIcon
        className="h-auto w-auto justify-center border-none bg-transparent px-0 [&_[data-slot=icon]]:ml-0 [&_[data-slot=icon]]:h-5 [&_[data-slot=icon]]:w-5"
        configs={ICON_CONFIGS}
        kind={field.kind}
      />
      <span className="flex-1 truncate" data-slot="label">
        {label}
      </span>
    </div>
  )
}
