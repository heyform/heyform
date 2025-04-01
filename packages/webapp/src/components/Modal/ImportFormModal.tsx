import { useRequest } from 'ahooks'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FormService } from '@/services'
import { useAppStore } from '@/store'
import { useRouter } from '@/utils'

import { Button, Modal } from '..'

interface ImportFormModalProps {
  projectId: string
}

export default function ImportFormModal({ projectId }: ImportFormModalProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formJson, setFormJson] = useState('')
  const [fileName, setFileName] = useState('')
  const { closeModal } = useAppStore()

  const { loading, run: importForm } = useRequest(
    async (formJson: string) => {
      const result = await FormService.importFromJSON(projectId, formJson)
      closeModal('ImportFormModal')
      router.push(`/form/${result.data.importFormFromJSON}`)
    },
    {
      manual: true
    }
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const json = e.target?.result as string
        setFormJson(json)
      } catch (error) {
        console.error('Error reading JSON file:', error)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (formJson) {
      importForm(formJson)
    }
  }

  return (
    <Modal
      title={t('form.import.title', 'Import Form')}
      description={t('form.import.description', 'Import a form from a JSON file')}
      visible
      onClose={closeModal}
    >
      <div className="mt-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="focus:ring-primary-500 flex w-full cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {t('form.import.selectFile', 'Select JSON file')}
          </button>

          {fileName && (
            <div className="text-sm text-gray-700">
              {t('form.import.selected', 'Selected')}: {fileName}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" disabled={loading} onClick={closeModal}>
            {t('components.cancel', 'Cancel')}
          </Button>
          <Button disabled={!formJson || loading} onClick={handleImport} loading={loading}>
            {t('form.import.import', 'Import')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
