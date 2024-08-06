import { FC } from 'react'
import { Trans } from 'react-i18next'

import { LogoIcon } from '../components'
import { useStore } from '../store'
import { useTranslation } from '../utils'

export const Branding: FC = () => {
  const { state } = useStore()
  const { t } = useTranslation()

  if (state.settings?.removeBranding) {
    return null
  }

  return (
    <a className="heyform-branding" href="https://heyform.net/?ref=badge" target="_blank">
      <Trans
        t={t}
        i18nKey="Made with HeyForm"
        components={{
          icon: <LogoIcon className="inline h-4 w-4" />,
          span: <span className="font-bold" />
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
