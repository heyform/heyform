import type { FormField } from '@heyform-inc/shared-types-enums'
import clsx from 'clsx'
import type { FC } from 'react'

import { Submit } from '../components'
import { useKey, useTranslation } from '../utils'
import { Block, BlockProps } from './Block'

interface EmptyStateProps extends Omit<BlockProps, 'field'> {
  field: Partial<FormField>
  onClick: () => void
}

export const EmptyState: FC<EmptyStateProps> = ({ className, field, onClick, ...restProps }) => {
  const { t } = useTranslation()

  useKey('Enter', onClick)

  return (
    <Block
      className={clsx('heyform-empty-state', className)}
      field={field as FormField}
      isScrollable={false}
      {...restProps}
    >
      <Submit text={field.properties?.buttonText || t('Next')} onClick={onClick} />
    </Block>
  )
}
