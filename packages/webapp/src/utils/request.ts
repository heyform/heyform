import { ApolloClient, ApolloQueryResult, InMemoryCache, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { helper } from '@heyform-inc/utils'
import { RetryLink } from 'apollo-link-retry'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'

import { clearAuthState, getBrowserId } from '@/utils'

const uploadLink = createUploadLink({
  uri: '/graphql',
  credentials: 'include'
})

const retryLink: any = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  }
})

const timeoutLink = new ApolloLinkTimeout(30000)

const headerLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-browser-Id': getBrowserId(),
      'x-anonymous-id': getBrowserId()
    }
  }
})

const errorLink = onError(({ response }) => {
  if (helper.isValid(response?.errors)) {
    const error: any = response!.errors![0]

    if (helper.isValid(error) && error.status === 401) {
      clearAuthState()
      window.location.href = '/login'
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
  link: from([retryLink, timeoutLink, headerLink, errorLink, uploadLink]),
  connectToDevTools: false,
  cache
})

// https://github.com/apollographql/apollo-client/issues/5903
function responseInterceptor<T = any>(response: ApolloQueryResult<T>): T {
  const operationName = Object.keys(response)[0]
  return JSON.parse(JSON.stringify((response as any)[operationName]))
}

export const request = {
  async mutate<T = any>(options: any): Promise<T> {
    const result = await client.mutate(options)
    return responseInterceptor<T>(result.data)
  },

  async query<T = any>(options: any): Promise<T> {
    const result = await client.query(options)
    return responseInterceptor<T>(result.data)
  }
}
