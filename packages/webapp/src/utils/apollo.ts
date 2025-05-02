import {
  ApolloClient,
  ApolloQueryResult,
  HttpLink,
  InMemoryCache,
  MutationOptions,
  QueryOptions,
  from
} from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { helper } from '@heyform-inc/utils'
import { RetryLink } from 'apollo-link-retry'
import ApolloLinkTimeout from 'apollo-link-timeout'

import { GRAPHQL_API_URL, IS_PROD } from '@/consts'

import { clearAuthState, getDeviceId } from './auth'

if (!IS_PROD) {
  // Adds messages only in a dev environment
  loadDevMessages()
  loadErrorMessages()
}

const httpLink = new HttpLink({
  uri: GRAPHQL_API_URL,
  credentials: 'include'
})

const retryLink: any = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  }
})

const timeoutLink = new ApolloLinkTimeout(30_000)

const headerLink = setContext((_, { headers }) => {
  // get `User-ID` from local storage or cookie if it exists
  const deviceId = getDeviceId()
  return {
    headers: {
      ...headers,
      'X-Device-Id': deviceId,
      'x-anonymous-id': deviceId
    }
  }
})

const errorLink = onError(({ response }) => {
  if (helper.isValid(response?.errors)) {
    const error: any = response!.errors![0]

    if (helper.isValid(error) && error.status === 401) {
      clearAuthState()
      window.location.href = '/logout'
      return
    }
  }
})

const cache = new InMemoryCache({
  addTypename: false
})

// Disable apollo devtools tips
window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ = true

const client = new ApolloClient({
  link: from([retryLink, timeoutLink, headerLink, errorLink, httpLink]),
  connectToDevTools: false,
  cache
})

// https://github.com/apollographql/apollo-client/issues/5903
function responseInterceptor<T = Any>(response: ApolloQueryResult<T>): T {
  const operationName = Object.keys(response)[0]

  return JSON.parse(JSON.stringify((response as Any)[operationName]))
}

export const apollo = {
  async mutate<T = Any>(options: MutationOptions): Promise<T> {
    const result = await client.mutate(options)

    return responseInterceptor<T>(result.data)
  },

  async query<T = Any>(options: QueryOptions): Promise<T> {
    const result = await client.query(options)

    return responseInterceptor<T>(result.data)
  }
}
