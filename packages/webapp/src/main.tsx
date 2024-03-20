import { IconMoodSad } from '@tabler/icons-react'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import 'unfetch/polyfill/polyfill.mjs'

import { EmptyStates } from '@/components/ui'
import '@/locales'
import Router from '@/router'
import { StoreProvider, store } from '@/store'
import { getBrowserId, setBrowserId } from '@/utils'

import './styles/index.scss'

if (!getBrowserId()) {
  setBrowserId()
}

const App = () => {
  const Fallback = (
    <EmptyStates
      className="flex h-screen flex-col justify-center"
      icon={<IconMoodSad />}
      title="Oops, Something went wrong"
      description="Brace yourself till we get the error fixed. You may also refresh the page or try again later."
    />
  )

  return (
    <ErrorBoundary fallback={Fallback}>
      <Suspense fallback={<></>}>
        <StoreProvider value={store}>
          <Router />
        </StoreProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
