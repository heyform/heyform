import { flattenFieldsWithGroups, questionNumber } from '@heyform-inc/form-renderer'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { createFieldNavigation, htmlUtils } from '@heyform-inc/answer-utils'

import { Select } from '@/components'
import { FormFieldType } from '@/types'

interface NextQuestionSelectProps {
  fields: FormFieldType[]
  currentField: FormFieldType
  value?: string
  // Shown for the empty value; defaults to "Next in form order".
  emptyLabel?: string
  hasError?: boolean
  onChange?: (value: string) => void
}

export function NextQuestionSelect({
  fields,
  currentField,
  value,
  emptyLabel,
  hasError,
  onChange
}: NextQuestionSelectProps) {
  const { t } = useTranslation()
  const options = useMemo(() => {
    const flattened = flattenFieldsWithGroups(fields)
    const navigation = createFieldNavigation(flattened)

    return [
      { value: '', label: emptyLabel ?? t('form.builder.logic.nextQuestion.formOrder') },
      ...flattened
        .filter(field => navigation.isValidNextFieldId(currentField.id, field.id))
        .map(field => ({
          value: field.id,
          label:
            `${questionNumber(field.index, field.parent?.index)} ${htmlUtils.plain(field.title as string) || t('form.builder.logic.nextQuestion.untitled')}`.trim()
        }))
    ]
  }, [fields, currentField.id, emptyLabel, t])

  return (
    <Select.Native
      options={options}
      value={value || ''}
      hasError={hasError}
      onChange={onChange}
      aria-label={t('form.builder.logic.nextQuestion.label')}
      className="w-full"
    />
  )
}
