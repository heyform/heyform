import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { FC } from 'react'

import { SheetCellProps } from '../types'
import { AddressCell } from './AddressCell'
import { DateRangeCell } from './DateRangeCell'
import { DropPickerCell } from './DropPickerCell'
import { FileUploadCell } from './FileUploadCell'
import { FullNameCell } from './FullNameCell'
import { HiddenFieldCell } from './HiddenFieldCell'
import { InputTableCell } from './InputTableCell'
import { IPAddressCell } from './IPAddressCell'
import { MultipleChoiceCell } from './MultipleChoiceCell'
import { OpinionScaleCell } from './OpinionScaleCell'
import { PaymentCell } from './PaymentCell'
import { PictureChoiceCell } from './PictureChoiceCell'
import { SignatureCell } from './SignatureCell'
import { SubmitDateCell } from './SubmitDateCell'
import { TextCell } from './TextCell'
import { UrlCell } from './UrlCell'

export const SheetCell: FC<SheetCellProps> = props => {
  switch (props.column.kind) {
    case 'submit_date':
      return <SubmitDateCell {...props} />

    case 'ip_address':
      return <IPAddressCell {...props} />

    case FieldKindEnum.YES_NO:
      return <DropPickerCell {...props} />

    case FieldKindEnum.URL:
      return <UrlCell {...props} />

    case FieldKindEnum.MULTIPLE_CHOICE:
      return <MultipleChoiceCell {...props} />

    case FieldKindEnum.PICTURE_CHOICE:
      return <PictureChoiceCell {...props} />

    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      return <OpinionScaleCell {...props} />

    case FieldKindEnum.FILE_UPLOAD:
      return <FileUploadCell {...props} />

    case FieldKindEnum.SIGNATURE:
      return <SignatureCell {...props} />

    case FieldKindEnum.ADDRESS:
      return <AddressCell {...props} />

    case FieldKindEnum.FULL_NAME:
      return <FullNameCell {...props} />

    case FieldKindEnum.DATE_RANGE:
      return <DateRangeCell {...props} />

    case FieldKindEnum.INPUT_TABLE:
      return <InputTableCell {...props} />

    case FieldKindEnum.PAYMENT:
      return <PaymentCell {...props} />

    case 'hidden_fields':
      return <HiddenFieldCell {...props} />

    default:
      return <TextCell {...props} />
  }
}
