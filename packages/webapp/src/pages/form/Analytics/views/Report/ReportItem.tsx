import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Progress } from '@/components/ui'

import { AnswerList } from './AnswerList'

interface ReportItemProps {
  index: number
  response: any
}

interface ChoicesProps {
  chooses: any[]
}

interface RatingProps extends ChoicesProps {
  length: number
  leftLabel?: string
  rightLabel?: string
}

interface RatingLabelProps {
  index: number
  length: number
  leftLabel?: string
  rightLabel?: string
}

interface RatingAverageProps {
  kind: FieldKindEnum
  average?: number
}

const Choices: FC<ChoicesProps> = ({ chooses }) => {
  const { t } = useTranslation()
  const total = chooses.reduce((prev, next) => prev + next.count, 0) || 1

  return (
    <div className="mb-4">
      {chooses.map((row, index) => (
        <div className="mb-5" key={index}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div>
              {row.label} · {total > 0 ? Math.round((row.count * 100) / total) : 0}%
            </div>
            <div className="text-[13px] text-[#b0b7c3]">
              {row.count} {t('report.responses')}
            </div>
          </div>
          <Progress
            className="!h-1 w-full"
            barClassName="!h-1"
            percent={(row.count * 100) / total}
          />
        </div>
      ))}
    </div>
  )
}

const RatingLabel: FC<RatingLabelProps> = ({ index, length, leftLabel, rightLabel }) => {
  return (
    <>
      {(() => {
        if (index === 0 && helper.isValid(leftLabel)) {
          return `${leftLabel} · `
        } else if (index === length - 1 && helper.isValid(rightLabel)) {
          return `${rightLabel} · `
        }
      })()}
    </>
  )
}

const RatingAverage: FC<RatingAverageProps> = ({ kind, average }) => {
  const { t } = useTranslation()
  return kind === FieldKindEnum.OPINION_SCALE || kind === FieldKindEnum.RATING ? (
    <>{` · ${average} ${t('report.average')}`}</>
  ) : (
    <></>
  )
}

const Rating: FC<RatingProps> = ({ length, leftLabel, rightLabel, chooses }) => {
  const { t } = useTranslation()
  const arrays = Array.from<number>({ length }).map((_, index) => index + 1)
  const total = chooses.filter(helper.isNumber).reduce((prev, next) => prev + next, 0)

  return (
    <div className="mb-4">
      {arrays.map((row, index) => {
        const num = chooses[row] || 0

        return (
          <div className="mb-5" key={index}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div>
                {row} ·{' '}
                <RatingLabel
                  index={index}
                  length={length}
                  leftLabel={leftLabel}
                  rightLabel={rightLabel}
                />
                {total > 0 ? Math.round((num * 100) / total) : 0}%
              </div>
              <div className="text-[13px] text-[#b0b7c3]">
                {num} {t('report.responses')}
              </div>
            </div>
            <Progress className="!h-1 w-full" barClassName="!h-1" percent={(num * 100) / total} />
          </div>
        )
      })}
    </div>
  )
}

export const ReportItem: FC<ReportItemProps> = ({ index, response }) => {
  const { t } = useTranslation()

  return (
    <div className="mb-10 rounded-[3px] bg-white px-[34px] pb-4 print:p-0">
      <div className="mb-1 pt-[34px] text-[16px] font-medium" id={`field-${response.id}`}>
        {index}. {response.title}
      </div>
      <div className="mb-6 text-[#8a94a6]">
        {response.count} {t('report.responses')}
        <RatingAverage kind={response.kind} average={response.average} />
      </div>
      {(() => {
        switch (response.kind) {
          case FieldKindEnum.YES_NO:
          case FieldKindEnum.MULTIPLE_CHOICE:
          case FieldKindEnum.PICTURE_CHOICE:
            return <Choices chooses={response.chooses} />

          case FieldKindEnum.RATING:
          case FieldKindEnum.OPINION_SCALE:
            return (
              <Rating
                length={response.properties?.total}
                leftLabel={response.properties?.leftLabel}
                rightLabel={response.properties?.rightLabel}
                chooses={response.chooses}
              />
            )

          default:
            return <AnswerList response={response} />
        }
      })()}
    </div>
  )
}
