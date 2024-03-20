import { IconEye } from '@tabler/icons-react'
import type { FC, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { EyeCloseIcon } from '../icons'
import type { InputProps } from './Input'
import Input from './Input'

export interface InputPasswordProps extends Omit<InputProps, 'type' | 'trailing'> {
  passwordIcon?: ReactNode
  textIcon?: ReactNode
}

const Password: FC<InputPasswordProps> = ({ passwordIcon, textIcon, ...restProps }) => {
  const [type, setType] = useState('password')

  function handleToggle() {
    setType((prevValue: string) => (prevValue === 'password' ? 'text' : 'password'))
  }

  const Toggle = useMemo(() => {
    return (
      <span className="input-password-toggle" onClick={handleToggle}>
        {type === 'password' ? passwordIcon || <EyeCloseIcon /> : textIcon || <IconEye />}
      </span>
    )
  }, [type])

  return <Input type={type} trailing={Toggle} {...restProps} />
}

export default Password
