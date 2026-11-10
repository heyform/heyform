import assert from 'assert'

const Module = require('module')
const originalLoad = Module._load

const issuer = 'https://identity.example.com'
const configuration = {
  serverMetadata: () => ({
    issuer,
    userinfo_endpoint: `${issuer}/userinfo`
  })
}

let authorizationParameters: Record<string, string> | undefined
let callbackChecks: Record<string, unknown> | undefined
let callbackUrl: URL | undefined
let discoveryCalls = 0
let clientAuthenticationMethod: string | undefined
let idTokenClaims: Record<string, unknown> = {}
let userInfoClaims: Record<string, unknown> = {}

const openidClient = {
  ClientSecretBasic: (clientSecret: string) => {
    assert.strictEqual(clientSecret, 'client_secret')
    return 'client_secret_basic'
  },
  ClientSecretPost: (clientSecret: string) => {
    assert.strictEqual(clientSecret, 'client_secret')
    return 'client_secret_post'
  },
  randomPKCECodeVerifier: () => 'pkce_verifier',
  calculatePKCECodeChallenge: async (verifier: string) => {
    assert.strictEqual(verifier, 'pkce_verifier')
    return 'pkce_challenge'
  },
  randomNonce: () => 'oidc_nonce',
  discovery: async (
    configuredIssuer: URL,
    clientId: string,
    clientMetadata: Record<string, string>,
    clientAuthentication: string
  ) => {
    discoveryCalls += 1
    assert.strictEqual(configuredIssuer.href, `${issuer}/`)
    assert.strictEqual(clientId, 'heyform')
    assert.deepStrictEqual(clientMetadata, {
      client_secret: 'client_secret',
      token_endpoint_auth_method: clientAuthentication
    })
    clientAuthenticationMethod = clientAuthentication
    return configuration
  },
  buildAuthorizationUrl: (_configuration: unknown, parameters: Record<string, string>) => {
    authorizationParameters = parameters
    return new URL(`${issuer}/authorize`)
  },
  authorizationCodeGrant: async (
    _configuration: unknown,
    url: URL,
    checks: Record<string, unknown>
  ) => {
    callbackUrl = url
    callbackChecks = checks
    return {
      access_token: 'access_token',
      claims: () => idTokenClaims
    }
  },
  fetchUserInfo: async (_configuration: unknown, accessToken: string, subject: string) => {
    assert.strictEqual(accessToken, 'access_token')
    assert.strictEqual(subject, idTokenClaims.sub)
    return userInfoClaims
  }
}

Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'openid-client') {
    return openidClient
  }

  return originalLoad.call(this, request, parent, isMain)
}

const { OidcSocialLogin, oidcIdentityKey } = require('../src/utils/social-login/oidc')

function createClient(clientAuthMethod?: 'client_secret_basic' | 'client_secret_post') {
  return new OidcSocialLogin({
    clientId: 'heyform',
    clientSecret: 'client_secret',
    clientAuthMethod,
    issuer,
    redirectUrl: 'https://forms.example.com/connect/oidc/callback'
  })
}

function resetClaims() {
  idTokenClaims = {
    sub: 'subject_1',
    email: 'User@Example.com',
    email_verified: true,
    name: 'Example User'
  }
  userInfoClaims = {}
  authorizationParameters = undefined
  callbackChecks = undefined
  callbackUrl = undefined
  clientAuthenticationMethod = undefined
}

function testIdentityUsesIssuerAndSubject() {
  assert.strictEqual(
    oidcIdentityKey('https://issuer-a.example.com', 'subject#1'),
    'https://issuer-a.example.com#subject%231'
  )
  assert.notStrictEqual(
    oidcIdentityKey('https://issuer-a.example.com', 'same-subject'),
    oidcIdentityKey('https://issuer-b.example.com', 'same-subject')
  )
}

async function testAuthorizationRequestBindsStatePkceAndNonce() {
  resetClaims()
  discoveryCalls = 0
  const client = createClient()
  const request = await client.getAuthRequest('state_1')

  assert.strictEqual(clientAuthenticationMethod, 'client_secret_basic')
  assert.strictEqual(request.url, `${issuer}/authorize`)
  assert.deepStrictEqual(request.transaction, {
    codeVerifier: 'pkce_verifier',
    nonce: 'oidc_nonce'
  })
  assert.deepStrictEqual(authorizationParameters, {
    redirect_uri: 'https://forms.example.com/connect/oidc/callback',
    scope: 'openid profile email',
    state: 'state_1',
    nonce: 'oidc_nonce',
    code_challenge: 'pkce_challenge',
    code_challenge_method: 'S256'
  })

  await client.getAuthRequest('state_2')
  assert.strictEqual(discoveryCalls, 1, 'discovery should be cached per configured client')

  await createClient('client_secret_post').getAuthRequest('state_3')
  assert.strictEqual(clientAuthenticationMethod, 'client_secret_post')
}

async function testCallbackValidatesTheOriginalTransaction() {
  resetClaims()
  const result = await createClient().getUserInfo(
    { code: 'authorization_code', state: 'state_1', iss: issuer },
    'state_1',
    { codeVerifier: 'pkce_verifier', nonce: 'oidc_nonce' }
  )

  assert.strictEqual(callbackUrl?.searchParams.get('code'), 'authorization_code')
  assert.strictEqual(callbackUrl?.searchParams.get('state'), 'state_1')
  assert.strictEqual(callbackUrl?.searchParams.get('iss'), issuer)
  assert.deepStrictEqual(callbackChecks, {
    pkceCodeVerifier: 'pkce_verifier',
    expectedNonce: 'oidc_nonce',
    expectedState: 'state_1',
    idTokenExpected: true
  })
  assert.deepStrictEqual(result, {
    openId: `${issuer}#subject_1`,
    issuer,
    subject: 'subject_1',
    emailVerified: true,
    providerName: 'Example User',
    user: {
      email: 'user@example.com',
      name: 'Example User',
      avatar: '',
      lang: 'en'
    }
  })
}

async function testEmailVerificationCannotCrossClaimSources() {
  resetClaims()
  userInfoClaims = {
    sub: 'subject_1',
    email: 'different@example.com',
    name: 'Example User'
  }

  const result = await createClient().getUserInfo(
    { code: 'authorization_code', state: 'state_1' },
    'state_1',
    { codeVerifier: 'pkce_verifier', nonce: 'oidc_nonce' }
  )

  assert.strictEqual(result.user.email, 'different@example.com')
  assert.strictEqual(
    result.emailVerified,
    false,
    'an ID Token verification flag must not verify a different email returned by UserInfo'
  )
}

async function testProviderNameIsOnlyTheNameClaim() {
  resetClaims()
  idTokenClaims = {
    sub: 'subject_1',
    email: 'user@example.com',
    email_verified: true,
    name: '  ',
    preferred_username: 'euser'
  }

  const result = await createClient().getUserInfo(
    { code: 'authorization_code', state: 'state_1' },
    'state_1',
    { codeVerifier: 'pkce_verifier', nonce: 'oidc_nonce' }
  )

  assert.strictEqual(result.user.name, 'euser')
  assert.strictEqual(
    result.providerName,
    undefined,
    'profile sync must not copy fallback names over a name the provider never sent'
  )

  idTokenClaims = { ...idTokenClaims, name: '  Example User ' }
  const named = await createClient().getUserInfo(
    { code: 'authorization_code', state: 'state_1' },
    'state_1',
    { codeVerifier: 'pkce_verifier', nonce: 'oidc_nonce' }
  )
  assert.strictEqual(named.providerName, 'Example User')
  assert.strictEqual(named.user.name, 'Example User')
}

async function testRejectsMissingCodeAndSubject() {
  resetClaims()
  const client = createClient()

  await assert.rejects(
    async () =>
      client.getUserInfo({ state: 'state_1' }, 'state_1', {
        codeVerifier: 'pkce_verifier',
        nonce: 'oidc_nonce'
      }),
    /missing a code/
  )

  idTokenClaims = { email: 'user@example.com', email_verified: true, name: 'Example User' }
  await assert.rejects(
    async () =>
      client.getUserInfo({ code: 'authorization_code', state: 'state_1' }, 'state_1', {
        codeVerifier: 'pkce_verifier',
        nonce: 'oidc_nonce'
      }),
    /missing the subject claim/
  )
}

async function run() {
  testIdentityUsesIssuerAndSubject()
  await testAuthorizationRequestBindsStatePkceAndNonce()
  await testCallbackValidatesTheOriginalTransaction()
  await testEmailVerificationCannotCrossClaimSources()
  await testProviderNameIsOnlyTheNameClaim()
  await testRejectsMissingCodeAndSubject()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
