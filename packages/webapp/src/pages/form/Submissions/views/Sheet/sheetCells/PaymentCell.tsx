import { CURRENCY_SYMBOLS } from '@heyform-inc/answer-utils'
import { ServerSidePaymentValue } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconCheck, IconClock, IconExternalLink } from '@tabler/icons-react'
import Big from 'big.js'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const PaymentCell: FC<SheetCellProps> = ({ column, row }) => {
  const value: ServerSidePaymentValue = row[column.key]
  const amount = value?.amount || 0
  const amountString = CURRENCY_SYMBOLS[value?.currency] + Big(amount).div(100).toFixed(2)
  const isCompleted = helper.isValid(value?.paymentIntentId)

  return (
    <div className="heygrid-cell-text overflow-hidden">
      {value && (
        <div className="flex h-full items-center">
          <div className="flex h-full flex-1 items-center overflow-hidden truncate">
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
            <div className="ml-2">{amountString}</div>
          </div>
          {isCompleted && (
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
