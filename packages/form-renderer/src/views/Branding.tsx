import { FC } from 'react'

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
      <LogoIcon /> {t('Made with {{name}}', { name: 'HeyForm' })}
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
