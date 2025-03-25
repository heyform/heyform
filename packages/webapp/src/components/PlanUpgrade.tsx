import { stopEvent } from '@heyform-inc/form-renderer'
import { IconCircleArrowUp } from '@tabler/icons-react'
import {
  FC,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useCallback
} from 'react'
import { useTranslation } from 'react-i18next'

import { PlanGradeEnum } from '@/consts'
import { useAppStore } from '@/store'

import { Tooltip } from './Tooltip'

type ComponentProps<E = HTMLElement> = HTMLAttributes<E>

interface UpgradeProps extends ComponentProps {
  minimalGrade: PlanGradeEnum
  tooltipLabel?: string
  isUpgradeShow?: boolean
  fallback?: (openUpgradeModal: () => void) => ReactNode
}

export const usePlanGrade = (minimalGrade: PlanGradeEnum) => {
  if (!minimalGrade) console.log('minimalGrade: ', minimalGrade)

  const { openModal } = useAppStore()
  // const { workspace } = useWorkspaceStore()

  const isAllowed = false
  const openUpgrade = useCallback(() => {
    if (!isAllowed) {
      openModal('UpgradeModal')
    }
  }, [isAllowed, openModal])

  return {
    isAllowed,
    openUpgrade
  }
}

export const PlanUpgrade: FC<UpgradeProps> = ({
  minimalGrade,
  tooltipLabel,
  isUpgradeShow = true,
  fallback = null,
  children,
  ...restProps
}) => {
  const { t } = useTranslation()
  const { isAllowed, openUpgrade } = usePlanGrade(minimalGrade)

  const openUpgradeModal = useCallback(
    (event?: MouseEvent<HTMLButtonElement>) => {
      event && stopEvent(event)
      openUpgrade()
    },
    [openUpgrade]
  )

  if (isAllowed) {
    return isValidElement(children)
      ? cloneElement(children as ReactElement, {
          ...(children as any).props,
          ...restProps
        })
      : null
  }

  return isUpgradeShow ? (
    <Tooltip label={tooltipLabel}>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-1 rounded-md border border-blue-600 px-2 py-1 text-sm/5 text-blue-600 sm:text-xs"
        onClick={openUpgradeModal}
      >
        <IconCircleArrowUp className="h-4 w-4" stroke={1.5} />
        {t('billing.upgrade.confirm')}
      </button>
    </Tooltip>
  ) : (
    fallback?.(openUpgradeModal)
  )
}
