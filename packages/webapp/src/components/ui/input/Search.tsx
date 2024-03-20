import { IconSearch } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC, KeyboardEvent } from 'react'

import { KeyCode } from '../utils'
import type { InputProps } from './Input'
import Input from './Input'

export interface InputSearchProps extends Omit<InputProps, 'leading' | 'onKeyDown'> {
  onSearch?: (value: string) => void
}

const Search: FC<InputSearchProps> = ({ className, onSearch, ...restProps }) => {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.keyCode === KeyCode.ENTER) {
      onSearch && onSearch((event.target as any).value)
    }
  }

  return (
    <Input
      className={clsx('input-search', className)}
      leading={<IconSearch />}
      onKeyDown={handleKeyDown}
      {...restProps}
    />
  )
}

export default Search
