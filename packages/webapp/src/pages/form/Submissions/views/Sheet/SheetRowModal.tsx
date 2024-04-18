import { CURRENCY_SYMBOLS } from '@heyform-inc/answer-utils'
import { Choice, FieldKindEnum, ServerSidePaymentValue } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
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
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { TagGroup } from '@/components'
import { Button } from '@/components/ui'
import { getFileUploadValue } from '@/utils'

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
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isString(v) || helper.isNumber(v)) {
      return v
    }
  }, [column.key, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value}
    </div>
  )
}

const HiddenFieldItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.name as string]

    if (helper.isString(v) || helper.isNumber(v)) {
      return v
    }
  }, [column.name, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value}
    </div>
  )
}

const DropdownItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]
    const choices = column.properties?.choices

    if (helper.isValidArray(choices)) {
      return choices!.find(choice => choice.id === v)
    }
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value && <TagGroup tags={[value]} />}
    </div>
  )
}

const UrlItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isURL(v)) {
      return v
    }
  }, [column.key, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      <a href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    </div>
  )
}

const DateItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isString(v) || helper.isNumber(v)) {
      return v
    }
  }, [column.key, row])

  return (
    <div className="min-h-11 w-[240px] whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value}
    </div>
  )
}

const DateRangeItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isObject(v)) {
      return [v?.start, v?.end].filter(Boolean).join('  -  ')
    }
  }, [column.key, row])

  return (
    <div className="min-h-11 w-[240px] whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value}
    </div>
  )
}

const InputTableItem: FC<SheetCellProps> = ({ column, row }) => {
  const columns = useMemo(() => {
    const cols = column.properties?.tableColumns

    if (helper.isValidArray(cols)) {
      return cols!
    }

    return []
  }, [column.properties?.tableColumns])

  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isValidArray(columns) && helper.isValidArray(v)) {
      return v.map((r: any) =>
        columns!.map(c => {
          if (helper.isValid(r) && helper.isObject(r) && helper.isString(r[c.id])) {
            return r[c.id]
          } else {
            return ''
          }
        })
      )
    }

    return []
  }, [column.key, columns, row])

  return (
    <div className="min-h-11 whitespace-pre-line border border-[#f3f3f3] bg-white p-2 text-sm font-normal leading-6 text-slate-800">
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
          {value.map((v: any, i: number) => (
            <tr key={i}>
              {v.map((c: any, j: number) => (
                <td
                  key={`${i}-${j}`}
                  className="whitespace-nowrap px-3 py-2 text-sm text-slate-500"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const OpinionScaleItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    return [helper.isString(v) || helper.isNumber(v) ? v : null, column.properties?.total]
      .filter(helper.isValid)
      .join(' / ')
  }, [column.key, column.properties?.total, row])

  return (
    <div className="min-h-11 w-[240px] whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value}
    </div>
  )
}

const PictureChoiceItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    let value: Choice[] = []

    const v = row[column.key]
    const choices = column.properties?.choices

    if (helper.isValid(v) && helper.isObject(v)) {
      if (helper.isValidArray(choices)) {
        if (helper.isValidArray(v?.value)) {
          value = choices!.filter(choice => v.value.includes(choice.id)) || []
        }

        if (v.other) {
          value.push({
            id: v.other,
            label: v.other
          })
        }
      }
    }

    return value
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="min-h-11 whitespace-pre-line border border-[#f3f3f3] bg-white p-2 text-sm font-normal leading-6 text-slate-800">
      {helper.isValid(value) ? (
        <div className="mb-[-12px] ml-[-6px] mr-[-6px] flex flex-wrap justify-between">
          {value!.map((choice, index) => (
            <div key={index}>
              <div className="mx-[6px] mb-3 rounded-[3px] border border-[rgba(0,0,0,0.2)] bg-white p-2">
                <div className="relative flex h-[120px] w-[120px] before:block before:w-screen before:pt-[100%] before:content-['']">
                  <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center overflow-hidden">
                    {choice.image ? (
                      <img
                        className="block max-h-[100px] min-h-[1px] max-w-[100%] object-cover"
                        src={choice.image}
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
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isValid(v) && helper.isObject(v)) {
      const choices = column.properties?.choices

      if (helper.isValidArray(choices)) {
        let result: Choice[] = []

        if (helper.isValidArray(v?.value)) {
          result = choices!.filter(choice => v.value.includes(choice.id)) || []
        }

        if (v.other) {
          result.push({
            id: v.other,
            label: v.other
          })
        }

        return result
      }
    }

    return []
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {helper.isValid(value) && <TagGroup tags={value} />}
    </div>
  )
}

const FileUploadItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => getFileUploadValue(row[column.key]), [column.key, row])

  if (helper.isEmpty(value)) {
    return (
      <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
        <IconPaperclip className="ml-[-4px] mr-1 h-5 w-5 text-[#A1A1A1]" />
      </div>
    )
  }

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      <a className="flex items-center" href={value!.url} target="_blank" rel="noreferrer">
        <IconPaperclip className="ml-[-4px] mr-1 h-5 w-5 text-[#A1A1A1]" />
        <span>{value!.filename}</span>
      </a>
    </div>
  )
}

const AddressItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    return helper.isObject(v) ? v : {}
  }, [column.key, row])

  return (
    <>
      <div className="mb-3 flex">
        <div className="heygrid-modal-form-label">Address Line 1"</div>
        <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value.address1}
        </div>
      </div>
      <div className="mb-3 flex">
        <div className="heygrid-modal-form-label">Address Line 2"</div>
        <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value.address2}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="mb-3 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">City"</div>
          <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value.city}
          </div>
        </div>
        <div className="mb-3 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">State/Province"</div>
          <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value.state}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="mb-0 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
          <div className="heygrid-modal-form-label">Zip/Postal Code"</div>
          <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value.zip}
          </div>
        </div>
        <div className="mb-0 flex w-[50%] pl-[6px] md:w-screen md:pl-0">
          <div className="heygrid-modal-form-label">Country"</div>
          <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
            {value.country}
          </div>
        </div>
      </div>
    </>
  )
}

const FullNameItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    return helper.isObject(v) ? v : {}
  }, [column.key, row])

  return (
    <div className="justify-between">
      <div className="mb-0 flex w-[50%] pr-[6px] md:w-screen md:pr-0">
        <div className="heygrid-modal-form-label">First name</div>
        <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value.firstName}
        </div>
      </div>
      <div className="mb-0 flex w-[50%] pl-[6px] md:w-screen md:pl-0">
        <div className="heygrid-modal-form-label">Last name</div>
        <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
          {value.lastName}
        </div>
      </div>
    </div>
  )
}

const SignatureItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isURL(v)) {
      return v
    }
  }, [column.key, row])

  return (
    <div className="min-h-11 whitespace-pre-line rounded-lg bg-white p-[10px] text-sm font-normal leading-6 text-slate-800">
      {value && <img src={value} width={500} height={120} />}
    </div>
  )
}

const PaymentItem: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v: ServerSidePaymentValue = row[column.key]

    if (helper.isValid(v) && helper.isObject(v)) {
      const amount = v!.amount || 0
      const amountString = CURRENCY_SYMBOLS[v!.currency] + Big(amount).div(100).toFixed(2)
      const isCompleted = helper.isValid(v!.paymentIntentId)

      return {
        amountString,
        isCompleted,
        receiptUrl: v.receiptUrl,
        paymentIntentId: v.paymentIntentId,
        billingDetails: v.billingDetails
      }
    }
  }, [column.key, row])

  if (!value) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="mr-2 text-2xl">{value.amountString}</div>
        {value.isCompleted ? (
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

      {value.isCompleted && (
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
  const columns = rawColumns.slice(1, rawColumns.length).sort((a, b) => {
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

                              case 'hidden_fields':
                                return <HiddenFieldItem row={row!} column={column} />

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
