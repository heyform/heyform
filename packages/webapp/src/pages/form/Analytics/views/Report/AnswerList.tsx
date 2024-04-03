import { Column, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as timeago from 'timeago.js'

import { Async, Heading, Pagination } from '@/components'
import { Modal, Spin } from '@/components/ui'
import { SubmissionService } from '@/service'
import { useParam } from '@/utils'

interface AnswerModel {
  submissionId: string
  kind: FieldKindEnum
  value: any
  endAt: number
}

interface AnswerListProps {
  response: {
    count: number
    answers: AnswerModel[]
    [key: string]: any
  }
}

const InputTableValue: FC<{ columns?: Column[]; value?: any }> = ({ columns = [], value }) => {
  return (
    <table className="w-full divide-y divide-gray-300">
      <thead>
        <tr>
          {columns.map(c => (
            <th key={c.id} className="px-3 py-1.5 text-left text-sm font-semibold text-slate-900">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {helper.isValidArray(value) && (
          <>
            {value!.map((v: any, index: number) => (
              <tr key={index}>
                {columns.map(c => (
                  <td key={c.id} className="whitespace-nowrap px-3 py-2 text-sm text-slate-500">
                    {v[c.id]}
                  </td>
                ))}
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  )
}

export const AnswerValue: FC<{ answer: AnswerModel; columns?: Column[] }> = ({
  answer,
  columns
}) => {
  return (
    <div className="mr-5 flex flex-1 items-center text-sm text-slate-900">
      {(() => {
        switch (answer.kind) {
          case FieldKindEnum.ADDRESS:
            return (
              answer.value &&
              `${answer.value.address1}, ${answer.value.address2} ${answer.value.city}, ${answer.value.state}, ${answer.value.zip}`
            )

          case FieldKindEnum.FULL_NAME:
            return answer.value && `${answer.value.firstName} ${answer.value.lastName}`

          case FieldKindEnum.DATE_RANGE:
            return (
              answer.value && [answer.value.start, answer.value.end].filter(Boolean).join(' - ')
            )

          case FieldKindEnum.INPUT_TABLE:
            return <InputTableValue columns={columns} value={answer.value} />

          case FieldKindEnum.FILE_UPLOAD:
            return (
              <a
                href={`${answer.value.cdnUrlPrefix}/${
                  answer.value.cdnKey
                }?attname=${encodeURIComponent(answer.value?.filename)}`}
                target="_blank"
                rel="noreferrer"
              >
                {answer.value?.filename}
              </a>
            )

          case FieldKindEnum.SIGNATURE:
            return (
              <a href={`${answer.value}?attname=signature.jpg`} target="_blank" rel="noreferrer">
                Signature
              </a>
            )

          default:
            return answer.value
        }
      })()}
    </div>
  )
}

interface AnswerModalProps {
  visible?: boolean
  response: any
  onVisibleChange?: (visible: boolean) => void
}

const AnswerModal: FC<AnswerModalProps> = ({ visible, response, onVisibleChange }) => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(1)
  const [answers, setAnswers] = useState<AnswerModel[]>([])

  function handleClose() {
    onVisibleChange && onVisibleChange(false)
  }

  function handlePageChange(page: number) {
    setPage(page)
  }

  async function fetchAnswers() {
    if (!visible) {
      return false
    }

    const result = await SubmissionService.answers({
      formId,
      fieldId: response.id,
      page
    })
    const { total, answers } = result

    setAnswers(answers)
    setTotal(total)

    return answers.length > 0
  }

  return (
    <Modal contentClassName="max-w-4xl" visible={visible} onClose={handleClose}>
      <div>
        <Heading style={{ textAlign: 'center' }}>{t('report.Responses')}</Heading>
      </div>

      <Async
        request={fetchAnswers}
        deps={[visible, page]}
        skeleton={
          <div className="flex items-center justify-center pt-10">
            <Spin />
          </div>
        }
      >
        <div>
          {answers.map(row => (
            <div
              className="flex items-center border-b border-[#f3f3f3] py-3"
              key={row.submissionId}
            >
              <AnswerValue answer={row} columns={response.properties?.tableColumns} />
              <div className="min-w-[100px] text-[13px] text-slate-500">
                {timeago.format(row.endAt! * 1_000)}
              </div>
            </div>
          ))}
        </div>

        <Pagination
          className="mt-8 justify-between !px-0"
          total={total}
          page={page}
          pageSize={30}
          onChange={handlePageChange}
        />
      </Async>
    </Modal>
  )
}

export const AnswerList: FC<AnswerListProps> = ({ response }) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  if (!helper.isValidArray(response.answers)) {
    return null
  }

  function handleClick() {
    setVisible(true)
  }

  return (
    <div className="mb-5 rounded-[3px] bg-[#fafbfc] p-6">
      {response.answers?.map(row => (
        <div className="flex items-center border-b border-[#f3f3f3] py-3" key={row.submissionId}>
          <AnswerValue answer={row} columns={response.properties?.tableColumns} />
          <div className="text-[13px] text-[#8a94a6]">{timeago.format(row.endAt! * 1_000)}</div>
        </div>
      ))}
      {response.count > 5 && (
        <div className="mt-3 inline-flex cursor-pointer hover:text-[#0252d7]" onClick={handleClick}>
          {t('report.seeAll', { count: response.count })}
        </div>
      )}
      <AnswerModal response={response} visible={visible} onVisibleChange={setVisible} />
    </div>
  )
}
