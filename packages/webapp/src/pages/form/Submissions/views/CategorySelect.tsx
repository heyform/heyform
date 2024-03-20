import { SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import { IconChevronDown } from '@tabler/icons-react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dropdown, Menus } from '@/components/ui'

interface CategorySelectProps {
  category: SubmissionCategoryEnum
  onChange: (category: SubmissionCategoryEnum) => void
}

const CATEGORY_MAPS = {
  [SubmissionCategoryEnum.INBOX]: 'submissions.Inbox',
  [SubmissionCategoryEnum.ARCHIVE]: 'submissions.Archive',
  [SubmissionCategoryEnum.STARRED]: 'submissions.Starred',
  [SubmissionCategoryEnum.SPAM]: 'submissions.Spam'
}

export const CategorySelect: FC<CategorySelectProps> = ({ category: rowCategory, onChange }) => {
  const { t } = useTranslation()
  const categories = [SubmissionCategoryEnum.INBOX, SubmissionCategoryEnum.SPAM]
  const [category, setCategory] = useState(rowCategory)

  const DropdownOverlay = (
    <Menus className="w-[13.75rem]" onClick={handleClick}>
      {categories.map(row => (
        <Menus.Item key={row} value={row} label={t(CATEGORY_MAPS[row])} />
      ))}
    </Menus>
  )

  function handleClick(value: any) {
    if (value !== category) {
      setCategory(value)
      onChange(value)
    }
  }

  return (
    <Dropdown overlay={DropdownOverlay}>
      <Button trailing={<IconChevronDown className="ml-2 h-6 w-6" />}>
        {t(CATEGORY_MAPS[category])}
      </Button>
    </Dropdown>
  )
}
