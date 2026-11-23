import type { Answer } from '@heyform-inc/shared-types-enums'

export function choiceMatrixAnswers(answer: Answer) {
  const selections = Array.isArray(answer.value) ? answer.value : []
  const columns = new Map(
    answer.properties?.matrixColumns?.map(column => [column.id, column.label])
  )
  const selectedColumns = new Map(
    selections
      .filter(selection => selection?.rowId && selection?.columnId)
      .map(selection => [selection.rowId, selection.columnId])
  )

  return (answer.properties?.matrixRows ?? []).map(row => ({
    rowId: row.id,
    rowLabel: row.label,
    columnLabel: columns.get(selectedColumns.get(row.id) as string) ?? ''
  }))
}

export function choiceMatrixAnswerText(answer: Answer) {
  return choiceMatrixAnswers(answer)
    .filter(row => row.columnLabel)
    .map(row => `${row.rowLabel}: ${row.columnLabel}`)
    .join(', ')
}
