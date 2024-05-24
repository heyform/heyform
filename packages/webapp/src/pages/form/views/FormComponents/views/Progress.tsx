import type { FC } from 'react'

import { useStore } from '../store'
import { useTranslation } from 'react-i18next'

interface CircularProgressbarProps {
  current: number
  max?: number
  radius?: number
  strokeWidth?: number
}

const DEGREE_IN_RADIANS: number = Math.PI / 180

function polarToCartesian(
  elementRadius: number,
  pathRadius: number,
  angleInDegrees: number
): string {
  const angleInRadians = (angleInDegrees - 90) * DEGREE_IN_RADIANS
  const x = elementRadius + pathRadius * Math.cos(angleInRadians)
  const y = elementRadius + pathRadius * Math.sin(angleInRadians)

  return x + ' ' + y
}

function getArc(
  current: number,
  total: number,
  pathRadius: number,
  elementRadius: number,
  isSemicircle = false
): string {
  const value = Math.max(0, Math.min(current || 0, total))
  const maxAngle = isSemicircle ? 180 : 359.9999
  const percentage = total === 0 ? maxAngle : (value / total) * maxAngle
  const start = polarToCartesian(elementRadius, pathRadius, percentage)
  const end = polarToCartesian(elementRadius, pathRadius, 0)
  const arcSweep = percentage <= 180 ? 0 : 1

  return `M ${start} A ${pathRadius} ${pathRadius} 0 ${arcSweep} 0 ${end}`
}

const CircularProgressbar: FC<CircularProgressbarProps> = ({
  current,
  max = 100,
  radius = 12,
  strokeWidth = 3
}) => {
  return (
    <svg className="heyform-circular-progressbar" viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
      <circle
        className="heyform-circular-circle"
        fill="none"
        cx={radius}
        cy={radius}
        r={radius - strokeWidth / 2}
        style={{
          strokeWidth
        }}
      />
      <path
        className="heyform-circular-path"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeWidth
        }}
        d={getArc(current, max, radius - strokeWidth / 2, radius)}
      />
    </svg>
  )
}

export const Progress: FC = () => {
  const { state } = useStore()
	const { t } = useTranslation()

  return (
    <div className="heyform-progress">
      <CircularProgressbar current={state.percentage} />
      <span>{state.percentage}{t('formBuilder.percentAnswered')}</span>
    </div>
  )
}
