import { FC } from 'react'
import { Trans } from 'react-i18next'

import { useTranslation } from '../utils'

import { LogoIcon } from '../components'
import { useStore } from '../store'

export const Branding: FC = () => {
  const { state } = useStore()
  const { t } = useTranslation()

  if (state.settings?.removeBranding) {
    return null
  }

  return (
    <a className="heyform-branding" href="https://heyform.net/?ref=badge" target="_blank">
      <Trans
        t={t as any}
        i18nKey="Made with Logisaar Forms"
        components={{
          icon: <LogoIcon className="inline h-4 w-4" />,
          span: <span className="font-medium" />
        }}
      />
    </a>
  )
}

export const WelcomeBranding: FC = () => {
  return (
    <div className="heyform-footer heyform-welcome-footer">
      <div className="heyform-footer-wrapper">
        <div className="heyform-footer-left" />
        <div className="heyform-footer-right">
          <Branding />
        </div>
      </div>
    </div>
  )
}
