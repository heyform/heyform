import { CURRENCY_SYMBOLS } from '@heyform-inc/answer-utils'
import { FieldKindEnum, ServerSidePaymentValue } from '@heyform-inc/shared-types-enums'
import { helper, unixDate } from '@heyform-inc/utils'
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconPaperclip,
  IconPhoto,
  IconX
} from '@tabler/icons-react'
import Big from 'big.js'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TagGroup } from '@/components'
import { Button, Input } from '@/components/ui'

import { SheetKindIcon } from './SheetKindIcon'
import { OnColumnOptionsUpdate, SheetCellProps, SheetColumn } from './types'

interface SheetRowModalProps {
  visible?: boolean
  columns: SheetColumn[]
  rowIdx: number
  rowCount: number
  row?: Record<string, any> | null
  onNextSubmission?: () => void
  onPrevSubmission?: () => void
  onClose?: () => void
  onColumnOptionsUpdate?: OnColumnOptionsUpdate
  onCellValueChange?: (rowIdx: number, column: SheetColumn, value: any) => void
}

const InputItem: FC<SheetCellProps> = ({ column, row }) => {
  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {row[column.key]}
    </div>
  )
}

const DropdownItem: FC<SheetCellProps> = ({ column, row }) => {
  const choice = column.properties?.choices?.find(choice => choice.id === row[column.key])

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {choice && <TagGroup tags={[choice]} />}
    </div>
  )
}

const UrlItem: FC<SheetCellProps> = ({ column, row }) => {
  const url = row[column.key]

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    </div>
  )
}

const DateItem: FC<SheetCellProps> = ({ column, row }) => {
  return (
    <div className="min-h-11 w-[240px] cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {row[column.key]}
    </div>
  )
}

const DateRangeItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  const arrays = [value?.start, value?.end].filter(Boolean)

  return (
    <div className="min-h-11 w-[240px] cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {arrays.join(' - ')}
    </div>
  )
}

const InputTableItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  const columns = column.properties?.tableColumns || []

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line border border-[#f3f3f3] bg-white p-2 text-sm font-normal leading-6 text-slate-800">
      <table className="w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.id} className="px-3 py-1.5 text-left text-sm font-semibold text-slate-900">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {helper.isValidArray(value) && (
            <>
              {value!.map((v: any, index: number) =>
                v ? (
                  <tr key={index}>
                    {columns.map(c => (
                      <td key={c.id} className="whitespace-nowrap px-3 py-2 text-sm text-slate-500">
                        {v[c.id]}
                      </td>
                    ))}
                  </tr>
                ) : null
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

const OpinionScaleItem: FC<SheetCellProps> = ({ column, row }) => {
  return (
    <div className="min-h-11 w-[240px] cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {row[column.key]} / {column.properties?.total}
    </div>
  )
}

const PictureChoiceItem: FC<SheetCellProps> = ({ column, row }) => {
  const choices = column.properties?.choices?.filter(choice =>
    row[column.key]?.value?.includes(choice.id)
  )

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line border border-[#f3f3f3] bg-white p-2 text-sm font-normal leading-6 text-slate-800">
      {helper.isValid(choices) ? (
        <div className="mb-[-12px] ml-[-6px] mr-[-6px] flex flex-wrap justify-between">
          {choices!.map((choice, index) => (
            <div key={index}>
              <div className="mx-[6px] mb-3 rounded-[3px] border border-[rgba(0,0,0,0.2)] bg-white p-2">
                <div className="relative flex min-h-[50px] w-screen before:block before:w-screen before:pt-[100%] before:content-['']">
                  <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center overflow-hidden">
                    {choice.image ? (
                      <img
                        className="block max-h-[100px] min-h-[1px] max-w-[100%] object-cover"
                        width={200}
                        height={200}
                        alt={choice.label}
                      />
                    ) : (
                      <IconPhoto className="h-9 w-9 text-[#A1A1A1]" />
                    )}
                  </div>
                </div>
                <div className="mt-2 h-5 overflow-hidden text-ellipsis whitespace-nowrap">
                  {choice.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-20 items-center justify-center text-[#A1A1A1]">
          Not been answered
        </div>
      )}
    </div>
  )
}

const MultipleChoiceItem: FC<SheetCellProps> = ({ column, row }) => {
  const choices = column.properties?.choices?.filter(choice =>
    row[column.key]?.value?.includes(choice.id)
  )

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {helper.isValid(choices) && <TagGroup tags={choices as any} />}
    </div>
  )
}

const FileUploadItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]

  if (helper.isEmpty(value)) {
    return (
      <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
        <IconPaperclip className="ml-[-4px] mr-1 h-5 w-5 text-[#A1A1A1]" />
      </div>
    )
  }

  const filename = encodeURIComponent(value!.filename)
  const downloadUrl = `${value.cdnUrlPrefix}/${value.cdnKey}?attname=${filename}`

  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      <a className="flex items-center" href={downloadUrl} target="_blank" rel="noreferrer">
        <IconPaperclip className="ml-[-4px] mr-1 h-5 w-5 text-[#A1A1A1]" />
        <span>{value?.filename}</span>
      </a>
    </div>
  )
}

const AddressItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]

  return (
    <>
      <div className="mb-3 flex">
        <div className="heygrid-modal-form-label">Address Line 1" </div>
        <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value?.address1}
        </div>
      </div>
      <div className="mb-3 flex">
        <div className="heygrid-modal-form-label">Address Line 2" </div>
        <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value?.address2}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="mb-3 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">City" </div>
          <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value?.city}
          </div>
        </div>
        <div className="mb-3 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">State/Province" </div>
          <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value?.state}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="mb-0 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">Zip/Postal Code" </div>
          <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value?.zip}
          </div>
        </div>
        <div className="mb-0 flex w-[50%] pl-[6px] md:w-screen md:pl-0">
          <div className="heygrid-modal-form-label">Country" </div>
          <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value?.country}
          </div>
        </div>
      </div>
    </>
  )
}

const FullNameItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]

  return (
    <div className="justify-between">
      <div className="mb-0 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
        <div className="heygrid-modal-form-label">First name </div>
        <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value?.firstName}
        </div>
      </div>
      <div className="mb-0 flex w-[50%] pl-[6px] md:w-screen md:pl-0">
        <div className="heygrid-modal-form-label">Last name </div>
        <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value?.lastName}
        </div>
      </div>
    </div>
  )
}

const SignatureItem: FC<SheetCellProps> = ({ column, row }) => {
  return (
    <div className="min-h-11 cursor-not-allowed whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      <img src={row[column.key]} width={500} height={120} />
    </div>
  )
}

const ContactItem: FC<SheetCellProps> = ({ row }) => {
  const { t } = useTranslation()
  const contact = row.contact
  const endAt: number = row.endAt ?? 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {contact ? (
          <>
            <img className="mr-3 h-10 w-10 rounded-[50%]" src={contact.avatar} />
            <div>
              <div>{contact.fullName}</div>
              <div className="text-[#8a94a6]">{contact.email}</div>
            </div>
          </>
        ) : (
          <>
            <div className="mr-3 h-10 w-10 rounded-[50%] bg-[#59d6b8] text-center text-[32px] font-semibold leading-10 text-white">
              ?
            </div>
            <div className="text-xl">{t('Anonymous')}</div>
          </>
        )}
      </div>
      <div className="text-[#b0b7c3]">{unixDate(endAt).format('MMM DD, YYYY')}</div>
    </div>
  )
}

const PaymentItem: FC<SheetCellProps> = ({ column, row }) => {
  const value: ServerSidePaymentValue = row[column.key]
  const amount = value.amount || 0
  const amountString = CURRENCY_SYMBOLS[value.currency] + Big(amount).div(100).toFixed(2)
  const isCompleted = helper.isValid(value.paymentIntentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="mr-2 text-2xl">{amountString}</div>
        {isCompleted ? (
          <div className="flex h-6 items-center rounded bg-green-100 pl-1 pr-2 text-sm text-green-800">
            <IconCheck className="h-4 w-4" />
            <span className="ml-1">Succeeded</span>
          </div>
        ) : (
          <div className="flex h-6 items-center rounded bg-gray-100 pl-1 pr-2 text-sm text-slate-800">
            <IconClock className="h-4 w-4" />
            <span className="ml-1">Incomplete</span>
          </div>
        )}
      </div>

      {isCompleted && (
        <div className="space-y-2 divide-y divide-slate-50">
          <div className="flex items-center justify-between">
            <span>Stripe payment ID</span>
            <span>{value.paymentIntentId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Client</span>
            <span>{value.billingDetails?.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}

const CustomTextCell: FC<SheetCellProps> = ({ rowIdx, column, row, onCellValueChange }) => {
  const [value, setValue] = useState(row[column.key])

  useEffect(() => {
    setValue(row[column.key])
  }, [row])

  function handleChange(value: any) {
    setValue(value)
    onCellValueChange!(rowIdx!, column, value)
  }

  return <Input value={value} onChange={handleChange} />
}

export const SheetRowModal: FC<SheetRowModalProps> = ({
  visible,
  columns: rawColumns,
  rowIdx,
  rowCount,
  row,
  onClose,
  onNextSubmission,
  onPrevSubmission,
  onColumnOptionsUpdate,
  onCellValueChange
}) => {
  const { t } = useTranslation()
  const isPreviousDisabled = rowIdx < 1
  const isNextDisabled = rowIdx >= rowCount - 1
  const columns = rawColumns.slice(1, rawColumns.length - 1).sort((a, b) => {
    // Sort frozen columns third:
    if (a.frozen) {
      if (b.frozen) return 0
      return -1
    }
    if (b.frozen) return 1

    // Sort other columns last:
    return 0
  })

  return (
    <>
      {visible && (
        <div className="heygrid-panel fixed bottom-0 left-0 right-0 top-0 z-10">
          <div
            className="absolute bottom-0 left-0 right-0 top-0 z-[10] bg-[rgba(50,59,75,0.3)]"
            onClick={onClose}
          />
          <div className="absolute bottom-0 right-[0px] top-0 z-[100] w-[40%] max-w-[600px] rounded-bl-xl rounded-tl-xl bg-white/90 shadow-2xl backdrop-blur-3xl">
            <div className="flex h-[3.75rem] select-none items-center border-b border-[#f3f3f3] px-9 py-4">
              <div className="flex flex-1 items-center">
                <Button.Link
                  className="p-1"
                  onClick={isPreviousDisabled ? undefined : onPrevSubmission}
                >
                  <IconChevronUp className="h-6 w-6 text-slate-800" />
                </Button.Link>

                <Button.Link
                  className="p-1"
                  onClick={isNextDisabled ? undefined : onNextSubmission}
                >
                  <IconChevronDown className="h-6 w-6 text-slate-800" />
                </Button.Link>

                <span className="ml-2">
                  {rowIdx + 1} of {rowCount} {t('Submissions')}
                </span>
              </div>

              <div className="flex select-none items-center">
                <Button.Link className="p-1" onClick={onClose}>
                  <IconX className="h-6 w-6 text-slate-800" />
                </Button.Link>
              </div>
            </div>

            <div className="h-[calc(100vh-3.75rem)] overflow-y-auto px-9 pb-6 pt-9">
              {columns.map((column, index) => (
                <div key={index}>
                  {column.kind !== 'submit_date' && (
                    <>
                      <div className="heygrid-header-cell flex items-center">
                        <SheetKindIcon
                          className="mr-2 h-[22px] w-[22px] p-0.5"
                          kind={column.kind!}
                        />
                        <span className="h-full flex-1 truncate">{column.name}</span>
                      </div>

                      <div className="pb-8">
                        {row &&
                          (() => {
                            switch (column.kind) {
                              case FieldKindEnum.YES_NO:
                                return <DropdownItem row={row!} column={column} />

                              case FieldKindEnum.MULTIPLE_CHOICE:
                                return <MultipleChoiceItem row={row!} column={column} />

                              case FieldKindEnum.PICTURE_CHOICE:
                                return <PictureChoiceItem row={row!} column={column} />

                              case FieldKindEnum.FILE_UPLOAD:
                                return <FileUploadItem row={row!} column={column} />

                              case FieldKindEnum.RATING:
                              case FieldKindEnum.OPINION_SCALE:
                                return <OpinionScaleItem row={row!} column={column} />

                              // Short text
                              case FieldKindEnum.NUMBER:
                              case FieldKindEnum.DATE:
                              case FieldKindEnum.PHONE_NUMBER:
                                return <DateItem row={row!} column={column} />

                              case FieldKindEnum.DATE_RANGE:
                                return <DateRangeItem row={row!} column={column} />

                              case FieldKindEnum.INPUT_TABLE:
                                return <InputTableItem row={row!} column={column} />

                              case FieldKindEnum.COUNTRY:
                                return <OpinionScaleItem row={row!} column={column} />

                              case FieldKindEnum.URL:
                                return <UrlItem row={row!} column={column} />

                              case FieldKindEnum.ADDRESS:
                                return <AddressItem row={row!} column={column} />

                              case FieldKindEnum.FULL_NAME:
                                return <FullNameItem row={row!} column={column} />

                              case FieldKindEnum.SIGNATURE:
                                return <SignatureItem row={row!} column={column} />

                              case FieldKindEnum.PAYMENT:
                                return <PaymentItem row={row!} column={column} />

                              default:
                                return <InputItem row={row!} column={column} />
                            }
                          })()}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
