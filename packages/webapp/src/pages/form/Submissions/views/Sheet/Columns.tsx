import { ExpandIcon } from '@/components'
import { Checkbox, stopPropagation } from '@/components/ui'

import { SelectCellFormatter } from './formatters'
import type { Column } from './types'

export const SELECT_COLUMN_KEY = 'select-row'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SelectColumn: Column<any, any> = {
  key: SELECT_COLUMN_KEY,
  headerCellClass: 'heygrid-header-select-cell',
  cellClass: 'heygrid-select-cell',
  name: '',
  width: 90,
  maxWidth: 90,
  resizable: false,
  sortable: false,
  frozen: true,
  headerRenderer(props) {
    return (
      <div className="flex h-full items-center">
        <Checkbox
          className="heygrid-checkbox"
          aria-label="Select All"
          checked={props.allRowsSelected}
          value={true}
          onChange={props.onAllRowsSelectionChange}
        />
      </div>
    )
  },
  formatter(props) {
    function handleExpand() {
      props.onRowExpand(props.row)
    }

    function handleChange(checked: boolean, _: any, event?: React.ChangeEvent<HTMLInputElement>) {
      props.onRowSelectionChange(checked, (event?.nativeEvent as MouseEvent).shiftKey)
    }

    return (
      <div className="flex h-full items-center justify-between" onClick={stopPropagation}>
        <div className="relative flex items-center">
          <span className="heygrid-rowidx w-5 text-center">{props.rowIdx + 1}</span>
          <Checkbox
            className="heygrid-checkbox !absolute left-1/2 top-1/2 -ml-2 -mt-2"
            aria-label="Select"
            checked={props.isRowSelected}
            value={true}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center" onClick={handleExpand}>
          <ExpandIcon className="heygrid-row-expand" />
        </div>
      </div>
    )
  },
  groupFormatter(props) {
    return (
      <SelectCellFormatter
        aria-label="Select Group"
        tabIndex={-1}
        isCellSelected={props.isCellSelected}
        value={props.isRowSelected}
        onChange={props.onRowSelectionChange}
        // Stop propagation to prevent row selection
        onClick={stopPropagation}
      />
    )
  }
}
