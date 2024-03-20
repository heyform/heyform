import { Answer, SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import { helper, parseNumber } from '@heyform-inc/utils'
import throttle from 'lodash/throttle'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Async, Pagination } from '@/components'
import { Button, Spin, notification } from '@/components/ui'
import { FormModel, SubmissionModel } from '@/models'
import { FormService, SubmissionService } from '@/service'
import { urlBuilder, useParam, useQuery } from '@/utils'

import { SelectedPanel } from './SelectedPanel'
import './style.scss'
import { CategorySelect } from './views/CategorySelect'
import { ExportLink } from './views/ExportLink'
import { Sheet } from './views/Sheet'
import { ColumnOptions, SheetColumn } from './views/Sheet/types'

const Submissions: FC = () => {
  const navigate = useNavigate()
  const { workspaceId, projectId, formId, category: rawCategory } = useParam()
  const category: any = helper.isValid(rawCategory) ? rawCategory : SubmissionCategoryEnum.INBOX
  const { page: rawPage } = useQuery()
  const pageSize = 30
  const page = parseNumber(rawPage, 1)!
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<FormModel | null>(null)
  const [total, setTotal] = useState(0)
  const [submissions, setSubmissions] = useState<SubmissionModel[]>([])
  const [deleting, setDeleting] = useState(false)
  const { t } = useTranslation()

  async function fetchData() {
    const [res1, res2] = await Promise.all([
      FormService.detail(formId),
      SubmissionService.submissions({
        formId,
        category,
        page
      })
    ])

    const { submissions, total } = res2

    setForm(res1)
    setSubmissions(submissions)
    setTotal(total)

    return submissions.length > 0
  }

  async function fetchSubmissions() {
    const result = await SubmissionService.submissions({
      formId,
      category,
      page
    })
    const { submissions, total } = result

    setSubmissions(submissions)
    setTotal(total)
  }

  function handleColumnPin(column: SheetColumn) {
    FormService.updateField({
      formId,
      fieldId: column.key,
      updates: {
        frozen: true
      }
    })
  }

  function handleColumnUnpin(column: SheetColumn) {
    FormService.updateField({
      formId,
      fieldId: column.key,
      updates: {
        frozen: false
      }
    })
  }

  function handleColumnHide(column: SheetColumn) {
    FormService.updateField({
      formId,
      fieldId: column.key,
      updates: {
        hide: true
      }
    })
  }

  async function handleColumnAdd(column: SheetColumn, options: ColumnOptions) {
    await FormService.createField(formId, {
      id: column.key,
      title: options.name as string,
      kind: options.kind as any,
      properties: {
        choices: options.choices || []
      },
      width: column.width as number,
      hide: column.hide,
      frozen: column.frozen
    })
  }

  async function handleColumnUpdate(column: SheetColumn, options: ColumnOptions) {
    const updates: any = {
      title: options.name as string,
      kind: options.kind,
      properties: {
        choices: options.choices
      }
    }

    await FormService.updateField({
      formId,
      fieldId: column.key,
      updates
    })
  }

  function handleColumnResize(column: SheetColumn, width: number) {
    FormService.updateField({
      formId,
      fieldId: column.key,
      updates: {
        width
      }
    })
  }

  function handleColumnDelete(column: SheetColumn) {
    FormService.deleteField(formId, column.key)
  }

  function handleCellValueChange(rowIdx: number, column: SheetColumn, value: any) {
    SubmissionService.updateAnswer({
      formId,
      submissionId: submissions[rowIdx].id,
      answer: {
        id: column.key,
        kind: column.kind,
        properties: column.properties,
        value
      } as Answer
    })
  }

  function handleCategoryChange(category: any) {
    navigate(
      `/workspace/${workspaceId}/project/${projectId}/form/${formId}/submissions/${category}`
    )
  }

  function handlePageChange(page: number) {
    const url = urlBuilder(
      `/workspace/${workspaceId}/project/${projectId}/form/${formId}/submissions/${category}`,
      {
        page
      }
    )
    navigate(url)
  }

  function handleDeselectedRows() {
    setSelectedRows(new Set())
  }

  function handleSelectedRowsChange(selectedRows: any) {
    setSelectedRows(selectedRows)
  }

  async function handleDelete() {
    if (deleting) {
      return
    }

    setDeleting(true)

    try {
      await SubmissionService.delete(formId, Array.from(selectedRows))
      await fetchSubmissions()
      handleDeselectedRows()
    } catch (_) {
      notification.error({
        title: 'Failed to delete selected submissions'
      })
    }

    setDeleting(false)
  }

  // 限制 cell 更新提交的频率
  const throttledCellValueChange = throttle(handleCellValueChange)

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex h-8 items-center">
            <CategorySelect category={category} onChange={handleCategoryChange} />
            <ExportLink />
          </div>
          <Pagination
            className="ml-3 !bg-transparent !p-0"
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
          />
        </div>
      </div>

      <div className="h-[calc(100vh-132px)]">
        <Async
          className="flex h-full items-center justify-center"
          request={fetchData}
          deps={[category, page]}
          skeleton={<Spin className="h-5 w-5 text-[#1d4ed8]" />}
        >
          <Sheet
            loading={false}
            formFields={[...(form?.fields || [])]}
            submissions={submissions}
            selectedRows={selectedRows}
            onSelectedRowsChange={handleSelectedRowsChange}
            onColumnPin={handleColumnPin}
            onColumnUnpin={handleColumnUnpin}
            onColumnHide={handleColumnHide}
            onColumnAdd={handleColumnAdd}
            onColumnUpdate={handleColumnUpdate}
            onColumnDelete={handleColumnDelete}
            onColumnResize={handleColumnResize}
            onCellValueChange={throttledCellValueChange}
          />
        </Async>

        <SelectedPanel
          selected={selectedRows}
          actions={
            <Button className="!py-1" type="danger" loading={deleting} onClick={handleDelete}>
              {t('submissions.Delete')}
            </Button>
          }
          onDeselect={handleDeselectedRows}
        />
      </div>
    </div>
  )
}

export default Submissions
