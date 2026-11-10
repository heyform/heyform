import { useTranslation } from 'react-i18next'

import LeftIcon from '@/assets/sidebar-floating-left.svg?react'
import RightIcon from '@/assets/sidebar-floating-right.svg?react'
import { Button } from '@/components'

export default function SidebarToggle({
  side,
  expanded,
  onClick
}: {
  side: 'left' | 'right'
  expanded: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()

  const Icon = side === 'left' ? LeftIcon : RightIcon
  const label =
    side === 'left'
      ? t(`form.builder.sidebar.${expanded ? 'collapseQuestions' : 'expandQuestions'}`)
      : t(`form.builder.sidebar.${expanded ? 'hideSettings' : 'showSettings'}`)

  return (
    <Button.Link
      className={
        expanded
          ? 'aria-expanded:hover:bg-accent-light aria-expanded:bg-transparent'
          : 'bg-foreground/60 hover:bg-foreground/80 rounded-full backdrop-blur-md'
      }
      size="sm"
      iconOnly
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
    >
      <Icon className="h-5 w-5" />
    </Button.Link>
  )
}
