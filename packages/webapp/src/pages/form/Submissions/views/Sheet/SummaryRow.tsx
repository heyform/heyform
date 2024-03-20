import { memo } from 'react'

import SummaryCell from './SummaryCell'
import type { RowRendererProps } from './types'

type SharedRowRendererProps<R, SR> = Pick<RowRendererProps<R, SR>, 'viewportColumns' | 'rowIdx'>

interface SummaryRowProps<R, SR> extends SharedRowRendererProps<R, SR> {
  row: SR
  bottom: number
}

function SummaryRow<R, SR>({ rowIdx, row, viewportColumns, bottom }: SummaryRowProps<R, SR>) {
  return (
    <div className="heygrid-row heygrid-summary-row" style={{ bottom }}>
      {viewportColumns.map(column => (
        <SummaryCell<R, SR> key={column.key} column={column} row={row} />
      ))}
    </div>
  )
}

export default memo(SummaryRow) as <R, SR>(props: SummaryRowProps<R, SR>) => JSX.Element
