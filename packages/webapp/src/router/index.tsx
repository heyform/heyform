import type { FC } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { getAuthState } from '@/utils'

import type { CustomRouteConfig } from './config'
import config from './config'

/*!
 * route-order https://github.com/sfrdmn/node-route-order
 *
 * Takes a sliced path and returns an integer representing the
 * "weight" of its free variables. More specific routes are heavier
 *
 * Intuitively: when a free variable is at the base of a path e.g.
 * '/:resource', this is more generic than '/resourceName/:id' and thus has
 * a lower weight
 *
 * Weight can only be used to compare paths of the same depth
 */
function pathWeight(sliced: string[]): number {
  return sliced.reduce(function (weight, part, i) {
    // If is bound part
    if (!/^:.+$/.test(part)) {
      // Weight is positively correlated to indexes of bound parts
      weight += Math.pow(i + 1, sliced.length)
    }
    return weight
  }, 0)
}

function sortRoute(pathA: string, pathB: string) {
  if (/^\/$/.test(pathA)) {
    return -1
  }

  if (/^\/$/.test(pathB)) {
    return 1
  }

  const slicedA = pathA.split('/')
  const slicedB = pathB.split('/')
  const depthA = slicedA.length
  const depthB = slicedB.length

  if (depthA === depthB) {
    const weightA = pathWeight(slicedA)
    const weightB = pathWeight(slicedB)
    return weightA > weightB ? 1 : -1
  } else {
    return depthA > depthB ? 1 : -1
  }
}

const CustomRoute: FC<CustomRouteConfig> = ({
  loginRequired = true,
  layout: Layout,
  component: Component,
  title
}) => {
  const { t } = useTranslation()
  const isLoggedIn = getAuthState()
  const children = (
    <Layout>
      <Component />
    </Layout>
  )

  useEffect(() => {
    if (title) {
      document.title = `${t(title)} - ${t('app.name')}`
    }
  }, [title])

  if (loginRequired) {
    if (isLoggedIn) {
      return children
    } else {
      const redirectUri = window.location.pathname + window.location.search
      return <Navigate to={`/login?redirect_uri=${encodeURIComponent(redirectUri)}`} replace />
    }
  } else {
    return !isLoggedIn ? children : <Navigate to="/" replace />
  }
}

export default () => {
  const routes = config.sort((i, j) => sortRoute(j.path, i.path))

  return (
    <BrowserRouter>
      <Routes>
        {routes.map(route => (
          <Route key={route.path} path={route.path} element={<CustomRoute {...route} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />}></Route>
      </Routes>
    </BrowserRouter>
  )
}
