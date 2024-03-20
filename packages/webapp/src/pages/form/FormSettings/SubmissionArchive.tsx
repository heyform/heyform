import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal, Switch } from '@/components/ui'
import { useVisible } from '@/utils'

interface SubmissionArchiveProps {
  value?: boolean
  onChange?: (value: boolean) => void
}

export const SubmissionArchive: FC<SubmissionArchiveProps> = ({ value, onChange }) => {
  const { t } = useTranslation()
  const [visible, openModal, closeModal] = useVisible()

  function handleChange(newValue: boolean) {
    if (!newValue) {
      openModal()
    } else {
      onChange?.(newValue)
    }
  }

  function handleConfirm() {
    closeModal()
    onChange?.(false)
  }

  return (
    <>
      <Switch value={value} onChange={handleChange} />

      <Modal.Confirm
        type="danger"
        visible={visible}
        title={t('formSettings.archive')}
        description={
          <p>
            Once you confirm to disable Submission Archive,{' '}
            <strong className="text-red-500">all submissions will be deleted</strong>.
          </p>
        }
        cancelLabel={t('formSettings.Cancel')}
        confirmLabel={t('formSettings.Confirm')}
        onClose={closeModal}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  )
}
