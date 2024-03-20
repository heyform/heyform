import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal, Table } from '@/components/ui'
import { TableColumn } from '@/components/ui/table'

const data: any[] = [
  {
    description: 'Form background',
    className: '.heyform-theme-background'
  },
  {
    description: 'Question number',
    className: 'heyform-block-number'
  },
  {
    description: 'Form block',
    className: '.heyform-block'
  },
  {
    description: 'Question title',
    className: '.heyform-block-title'
  },
  {
    description: 'Question description',
    className: '.heyform-block-description'
  },
  { description: 'Multiple choice question', className: '.heyform-multiple-choice' },
  { description: 'Full name question', className: '.heyform-full-name' },
  { description: 'Email question', className: '.heyform-email' },
  { description: 'Welcome question', className: '.heyform-welcome' },
  { description: 'Short Text question', className: '.heyform-short-text' },
  { description: 'Long text question', className: '.heyform-long-text' },
  { description: 'Number question', className: '.heyform-number' },
  { description: 'Yes/No question', className: '.heyform-yes-no' },
  { description: 'File upload question', className: '.heyform-file-upload' },
  { description: 'Opinion scale question', className: '.heyform-opinion-scale' },
  { description: 'Rating question', className: '.heyform-rating' },
  { description: 'Statement question', className: '.heyform-statement' },
  { description: 'Picture choice question', className: '.heyform-picture-choice' },
  { description: 'Address question', className: '.heyform-address' },
  { description: 'Country question', className: '.heyform-country' },
  { description: 'Date question', className: '.heyform-date' },
  { description: 'Legal terms question', className: '.heyform-legal-terms' },
  { description: 'Signature question', className: '.heyform-signature' },
  { description: 'Website question', className: '.heyform-website' },
  { description: 'Thank you question', className: '.heyform-heyform-thank-you' },
  {
    description: 'Short input',
    className: '.heyform-input'
  },
  {
    description: 'Long input',
    className: '.heyform-textarea'
  },
  {
    description: 'Submit button',
    className: '.heyform-submit-button'
  }
]
const codeExample = `/* Page background */
.heyform-theme-background {
  background: linear-gradient(45deg, rgb(217, 244, 255), rgb(255, 143, 167), rgb(93, 104, 255))
}

/* Hide question number */
.heyform-block-number {
  display: none;
}

/* Custom submit button */
.heyform-submit-button {
  background: linear-gradient(90deg, rgb(255, 248, 85) 0.04%, rgb(70, 227, 183) 100.04%);
  color: white;
}
`

const CustomCssHelpModal: FC<IModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation()
  const columns: TableColumn<any>[] = [
    {
      key: 'description',
      name: t('formBuilder.customCssTableDescription')
    },
    {
      key: 'className',
      name: t('formBuilder.customCssTableClass')
    }
  ]

  return (
    <Modal visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium text-slate-900">{t('formBuilder.CustomCSS')}</h1>
          <p className="mr-8 mt-1 text-base text-slate-500">
            {t('formBuilder.CustomCSSDescription')}
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium text-slate-900">Example</h2>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2">
            <code dangerouslySetInnerHTML={{ __html: codeExample }} />
          </pre>
        </div>

        <div>
          <h2 className="text-base font-medium text-slate-900">CSS classes</h2>
          <Table className="mt-2" columns={columns} data={data} />
        </div>
      </div>
    </Modal>
  )
}

export default CustomCssHelpModal
