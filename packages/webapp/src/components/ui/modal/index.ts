import type { FC } from 'react'

import type { ConfirmModalProps } from './Confirm'
import Confirm from './Confirm'
import type { ModalProps } from './Modal'
import Modal from './Modal'

type ExportModalType = FC<ModalProps> & {
  Confirm: FC<ConfirmModalProps>
}

const ExportModal = Modal as ExportModalType
ExportModal.Confirm = Confirm

export default ExportModal
