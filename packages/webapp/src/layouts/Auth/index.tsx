import { LayoutProps } from '@heyooo-inc/react-router'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { helper } from '@heyform-inc/utils'

import LogoPng from '@/assets/logo.png'

import LanguageSwitcher from './LanguageSwitcher'

export const AuthLayout: FC<LayoutProps> = ({ options, children }) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (helper.isValid(options?.title)) {
      document.title = `${t(options!.title)} - Logisaar Forms`
    }
  }, [options, t])

  return (
    <div className="bg-foreground flex min-h-screen flex-col">
      <div className="bg-foreground sticky top-0 flex items-center justify-between p-4">
        <a href="/" className="glass-logo-pill" title="Logisaar Forms">
          <img src={LogoPng} alt="Logisaar Forms" />
        </a>

        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col justify-center p-4 lg:p-12">{children}</div>
    </div>
  )
}
