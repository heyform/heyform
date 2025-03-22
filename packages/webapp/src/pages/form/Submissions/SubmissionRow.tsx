import { FormField } from '@heyform-inc/shared-types-enums'
import { FC, useMemo } from 'react'

import { SubmissionType } from '@/types'

import SubmissionCell from './SubmissionCell'

interface SubmissionRowProps {
  fields: FormField[]
  submission: SubmissionType
}

const SubmissionRow: FC<SubmissionRowProps> = ({ fields, submission }) => {
  const cells = useMemo(
    () =>
      fields.map(field => {
        const answer = submission.answers.find(answer => answer.id === field.id)

        return {
          field,
          submission,
          answer
        }
      }),
    [fields, submission]
  )

  return (
    <tr className="max-w-60 border-b border-accent hover:bg-primary/[2.5%]">
      {cells.map(cell => (
        <td key={cell.field.id} className="px-4 py-2">
          {cell.answer && (
            <SubmissionCell
              field={cell.field}
              submission={submission}
              answer={cell.answer}
              isTableCell
            />
          )}
        </td>
      ))}
    </tr>
  )
}

export default SubmissionRow
