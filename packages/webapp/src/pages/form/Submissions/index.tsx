import {
  Answer,
  FieldKindEnum,
  FormField,
  QUESTION_FIELD_KINDS,
  SubmissionCategoryEnum
} from '@heyform-inc/shared-types-enums'
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconDownload,
  IconMaximize,
  IconMinimize,
  IconTrash
} from '@tabler/icons-react'
import { useBoolean, useRequest } from 'ahooks'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SubmissionService } from '@/services'
import { cn, useParam } from '@/utils'
import { flattenFields } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

import IconMove from '@/assets/move.svg?react'
import {
  Button,
  Dropdown,
  EmptyState,
  Repeat,
  Select,
  Table,
  TableColumn,
  TableFetchParams,
  TableRef,
  TableState,
  Tooltip
} from '@/components'
import { useAppStore, useFormStore } from '@/store'
import { SubmissionType } from '@/types'

import SubmissionCell, { SubmissionHeaderCell } from './SubmissionCell'
import SubmissionDetailModal from './SubmissionDetailModal'

const SUBMISSION_CATEGORIES = [
  {
    label: 'form.submissions.inbox',
    value: 'inbox'
  },
  {
    label: 'form.submissions.spam',
    value: 'spam'
  }
]

const PSEUDONYM_ID_FIELD_ID = 'pseudonym_id'

export default function FormSubmissions() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { form } = useFormStore()
  const { openModal, closeModal } = useAppStore()

  const tableRef = useRef<TableRef<SubmissionType> | null>(null)

  const [category, setCategory] = useState<string>(SubmissionCategoryEnum.INBOX)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [hiddenFieldIds, setHiddenFieldIds] = useState<string[]>([])
  const [isMaximized, { toggle }] = useBoolean(false)

  const targetCategory = useMemo(
    () =>
      category === SubmissionCategoryEnum.INBOX
        ? SubmissionCategoryEnum.SPAM
        : SubmissionCategoryEnum.INBOX,
    [category]
  )

  const { loading: deleteLoading, run: deleteRun } = useRequest(
    async () => {
      await SubmissionService.delete(formId, selectedRowKeys)
      await tableRef.current?.refresh()

      setSelectedRowKeys([])
    },
    {
      manual: true,
      refreshDeps: [formId, selectedRowKeys]
    }
  )

  const { loading: moveLoading, run: moveRun } = useRequest(
    async () => {
      await SubmissionService.updateCategory({
        formId,
        submissionIds: selectedRowKeys,
        category: targetCategory
      })
      await tableRef.current?.refresh()

      setSelectedRowKeys([])
    },
    {
      manual: true,
      refreshDeps: [formId, selectedRowKeys, targetCategory]
    }
  )

  const fields = useMemo(() => {
    const pseudonymIdField = {
      id: PSEUDONYM_ID_FIELD_ID,
      kind: FieldKindEnum.SHORT_TEXT,
      title: 'Pseudonym ID'
    }
    const submitDateField = {
      id: FieldKindEnum.SUBMIT_DATE,
      kind: FieldKindEnum.SUBMIT_DATE,
      title: t('form.builder.question.submitDate')
    }

    const questionFields = flattenFields(form?.drafts || []).filter(row =>
      QUESTION_FIELD_KINDS.includes(row.kind)
    )

    const variables = (form?.variables || []).map(row => ({
      id: row.id,
      kind: FieldKindEnum.VARIABLE,
      title: row.name
    }))

    const hiddenFields = (form?.hiddenFields || []).map(row => ({
      id: row.id,
      kind: FieldKindEnum.HIDDEN_FIELDS,
      title: row.name
    }))

    return [
      pseudonymIdField,
      submitDateField,
      ...questionFields,
      ...variables,
      ...hiddenFields
    ] as FormField[]
  }, [form?.drafts, form?.hiddenFields, form?.variables, t])

  async function fetch({ current, pageSize }: TableFetchParams) {
    const { total, submissions } = await SubmissionService.submissions({
      formId,
      category,
      page: current,
      limit: pageSize
    })

    const list = submissions.map(row => ({
      ...row,
      answers: [
        ...row.answers,

        ...(row.pseudonymId
          ? [
              {
                id: PSEUDONYM_ID_FIELD_ID,
                kind: FieldKindEnum.SHORT_TEXT,
                value: row.pseudonymId
              }
            ]
          : []),

        ...(row.variables || []).map(v => ({
          ...v,
          kind: FieldKindEnum.VARIABLE
        })),

        ...(row.hiddenFields || []).map(v => ({
          ...v,
          kind: FieldKindEnum.HIDDEN_FIELDS
        })),

        {
          id: FieldKindEnum.SUBMIT_DATE,
          kind: FieldKindEnum.SUBMIT_DATE,
          value: row.endAt || 0
        }
      ] as Answer[]
    }))

    return {
      total,
      list
    }
  }

  const visibleFields = useMemo(
    () => fields.filter(row => !hiddenFieldIds.includes(row.id)),
    [fields, hiddenFieldIds]
  )

  const columns: TableColumn<FormField, SubmissionType>[] = useMemo(
    () =>
      visibleFields.map(row => ({
        field: row,
        headerRender: field => <SubmissionHeaderCell field={field} />,
        cellRender: (field, submission) => {
          const answer = submission.answers.find(answer => answer.id === field.id)

          if (!answer) {
            return <td />
          }

          return (
            <SubmissionCell field={field} submission={submission} answer={answer} isTableCell />
          )
        }
      })),
    [visibleFields]
  )

  const viewOptions = useMemo(
    () =>
      fields.map(field => ({
        value: field.id,
        label:
          helper.isArray(field.title) && field.title.length > 0
            ? String(field.title[0])
            : String(field.title || field.id),
        icon: hiddenFieldIds.includes(field.id) ? undefined : <IconCheck className="h-4 w-4" />
      })),
    [fields, hiddenFieldIds]
  )

  function handleViewOptionClick(value: string) {
    setHiddenFieldIds(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function handleToggle() {
    toggle()
  }

  function handleDownload() {
    window.open(`/api/export/submissions?formId=${encodeURIComponent(formId)}`)
  }

  function handleClose() {
    closeModal('SubmissionDetailModal')
    tableRef.current?.unexpand()
  }

  const handleExpandedChange = useCallback(
    (submission: SubmissionType, state: TableState) => {
      openModal('SubmissionDetailModal', {
        ...state,
        submission,
        fields,
        ref: tableRef.current
      })
    },
    [fields, openModal]
  )

  return (
    <>
      <div className={cn(isMaximized ? 'bg-foreground fixed inset-0 p-6' : 'mt-6 px-6')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2.5">
            <Select
              value={category}
              options={SUBMISSION_CATEGORIES}
              contentProps={{
                sideOffset: 8
              }}
              multiLanguage
              onChange={setCategory}
            />

            {selectedRowKeys.length > 0 && (
              <>
                <Tooltip
                  label={t('form.submissions.moveTo', {
                    name: t(`form.submissions.${targetCategory}`)
                  })}
                >
                  <Button.Ghost size="md" loading={moveLoading} iconOnly onClick={moveRun}>
                    <IconMove className="h-5 w-5" />
                  </Button.Ghost>
                </Tooltip>

                <Tooltip label={t('components.delete')}>
                  <Button.Ghost size="md" loading={deleteLoading} iconOnly onClick={deleteRun}>
                    <IconTrash className="h-5 w-5" />
                  </Button.Ghost>
                </Tooltip>
              </>
            )}
          </div>

          <div className="flex items-center gap-x-2.5">
            <Tooltip label={t('form.submissions.downloadCSV')}>
              <Button.Ghost size="md" iconOnly onClick={handleDownload}>
                <IconDownload className="h-5 w-5" />
              </Button.Ghost>
            </Tooltip>

            <Tooltip
              label={isMaximized ? t('form.submissions.minimize') : t('form.submissions.maximize')}
            >
              <Button.Ghost size="md" iconOnly onClick={handleToggle}>
                {isMaximized ? (
                  <IconMinimize className="h-5 w-5" />
                ) : (
                  <IconMaximize className="h-5 w-5" />
                )}
              </Button.Ghost>
            </Tooltip>

            <Dropdown
              options={viewOptions}
              contentProps={{
                sideOffset: 8,
                className: 'min-w-44 max-h-80 overflow-y-auto'
              }}
              onClick={handleViewOptionClick}
            >
              <Button.Ghost size="md">
                <IconAdjustmentsHorizontal className="h-5 w-5" />
                <span className="hidden sm:block">{t('form.submissions.view')}</span>
              </Button.Ghost>
            </Dropdown>
          </div>
        </div>

        <div className="mt-4">
          <Table
            ref={tableRef}
            classNames={{
              container: cn(
                'hf-table-shell scrollbar text-sm',
                isMaximized ? 'h-[calc(100vh-9rem)]' : 'h-[calc(100vh-23.45rem)]'
              ),
              table:
                '[&_tbody_td]:max-w-60 [&_tbody_td]:font-normal [&_thead_th]:truncate [&_thead_th]:max-w-60',
              footer: 'justify-end text-sm'
            }}
            columns={columns}
            loader={
              <Repeat count={20}>
                <div className="border-accent-light flex h-11 items-center gap-x-8 border-b px-4">
                  <div className="skeleton h-4 w-4 rounded-md" />
                  <div className="skeleton h-4 w-20 rounded-md" />
                  <div className="skeleton h-4 w-60 rounded-md" />
                  <div className="skeleton h-4 w-80 rounded-md" />
                </div>
              </Repeat>
            }
            emptyRender={({ refresh }) => (
              <EmptyState
                className="flex h-[calc(100vh-26.5rem)] flex-col items-center justify-center border-0 bg-transparent p-0"
                headline={t('form.submissions.headline')}
                subHeadline={t('form.submissions.subHeadline')}
                buttonTitle={t('components.refresh')}
                onClick={refresh}
              />
            )}
            fetch={fetch}
            refreshDeps={[formId, category]}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            onExpandedChange={handleExpandedChange}
          />
        </div>
      </div>

      <SubmissionDetailModal onClose={handleClose} />
    </>
  )
}
