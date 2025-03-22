import { helper } from '@heyform-inc/utils'
import { LayoutProps } from '@heyooo-inc/react-router'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Logo from '@/assets/logo.svg?react'

import LanguageSwitcher from './LanguageSwitcher'

export const AuthLayout: FC<LayoutProps> = ({ options, children }) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (helper.isValid(options?.title)) {
      document.title = `${t(options!.title)} - HeyForm`
    }
  }, [options, t])

  return (
    <div className="flex min-h-screen flex-col bg-foreground">
      <div className="sticky top-0 flex items-center justify-between bg-foreground p-4">
        <a href="/" className="flex items-center gap-2" title="HeyForm">
          <Logo className="h-8 w-auto" />
          <span className="text-xl font-medium">HeyForm</span>
        </a>

        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col justify-center p-4 lg:p-12">{children}</div>
    </div>
  )
}
