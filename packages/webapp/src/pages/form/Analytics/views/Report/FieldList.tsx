import { flattenFields, htmlUtils } from '@heyform-inc/answer-utils'
import { STATEMENT_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { useStore } from '@/store'

export const FieldList: FC = observer(() => {
  const { t } = useTranslation()
  const formStore = useStore('formStore')
  const fields = flattenFields(formStore.current?.fields).filter(
    field => !STATEMENT_FIELD_KINDS.includes(field.kind)
  )

  function handleClick(id: string) {
    const elem = document.getElementById(`field-${id}`)

    elem?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })
  }

  return (
    <div className="hidden w-[280px] md:block print:hidden">
      <div className="sticky top-10 mt-11 h-[calc(100vh-212px)] overflow-y-auto rounded-[3px] bg-white p-5">
        <div className="px-[14px] py-2 text-[#8a94a6]">{t('report.Questions')}</div>
        {fields?.map((row, index) => {
          const title = helper.isArray(row.title)
            ? htmlUtils.plain(htmlUtils.serialize(row.title as any))
            : row.title

          return (
            <div
              className="block cursor-pointer px-[14px] py-2 font-normal text-[#4e5d78]"
              key={row.id}
              onClick={() => handleClick(row.id)}
            >
              {index + 1}. {title}
            </div>
          )
        })}
      </div>
    </div>
  )
})
