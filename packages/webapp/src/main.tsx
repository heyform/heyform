import { ApolloError } from '@apollo/client'
import Router, { Route } from '@heyooo-inc/react-router'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Sentry from '@sentry/react'
import { ReactNode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import {
  Navigate,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType
} from 'react-router-dom'

import { Toaster } from '@/components'
import { IS_PROD, PACKAGE_VERSION, REDIRECT_COOKIE_NAME, SENTRY_DSN } from '@/consts'
import '@/i18n'
import { AuthLayout } from '@/layouts'
import routes from '@/routes'
import '@/styles/globals.scss'
import { getAuthState, getDeviceId, setCookie, setDeviceId } from '@/utils'

if (IS_PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: PACKAGE_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      })
    ],
    tracesSampleRate: 1.0,
    beforeSend: (event, hit) => {
      if (hit?.originalException instanceof ApolloError) {
        return null
      }
      return event
    }
  })
}

// Setup device ID
if (!getDeviceId()) {
  setDeviceId()
}

const Fallback = () => {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <h1 className="text-center text-2xl font-semibold">{t('components.error.title')}</h1>
      <p className="text-center text-sm/6 text-secondary">{t('components.error.message')}</p>
    </AuthLayout>
  )
}

const App = () => {
  function render(options?: any, children?: ReactNode) {
    const isLoggedIn = getAuthState()

    if (options?.loginRequired) {
      if (!isLoggedIn) {
        const redirectUri = window.location.pathname + window.location.search

        setCookie(REDIRECT_COOKIE_NAME, redirectUri, {})
        return <Navigate to="/login" replace />
      }
    } else {
      if (isLoggedIn && options?.redirectIfLogged) {
        return <Navigate to="/" replace />
      } else {
        return children
      }
    }
  }

  return (
    <Sentry.ErrorBoundary fallback={<Fallback />}>
      <Tooltip.Provider>
        <Router routes={routes as Route[]} render={render} />
      </Tooltip.Provider>
      <Toaster />
    </Sentry.ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
