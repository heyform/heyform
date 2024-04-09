import { CURRENCY_SYMBOLS } from '@heyform-inc/answer-utils'
import { ServerSidePaymentValue } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconCheck, IconClock, IconExternalLink } from '@tabler/icons-react'
import Big from 'big.js'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const PaymentCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v: ServerSidePaymentValue = row[column.key]

    if (helper.isValid(v) && helper.isObject(v)) {
      const amount = v!.amount || 0
      const amountString = CURRENCY_SYMBOLS[v!.currency] + Big(amount).div(100).toFixed(2)
      const isCompleted = helper.isValid(v!.paymentIntentId)

      return {
        amountString,
        isCompleted,
        receiptUrl: v.receiptUrl
      }
    }
  }, [column.key, row])

  return (
    <div className="heygrid-cell-text overflow-hidden">
      {value && (
        <div className="flex h-full items-center">
          <div className="flex h-full flex-1 items-center overflow-hidden truncate">
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
            <div className="ml-2">{value.amountString}</div>
          </div>
          {value.isCompleted && (
            <div className="ml-2">
              <a href={value.receiptUrl} target="_blank">
                <IconExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
