import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import got from 'got'

import { AppService } from './app.service'
import { IntegrationConnectionService } from './integration-connection.service'
import { IntegrationService } from './integration.service'
import { RedisService } from './redis.service'
import { APP_HOMEPAGE_URL } from '@environments'
import {
  IntegrationConnectionModel,
  IntegrationConnectionStatusEnum,
  IntegrationModel,
  IntegrationStatusEnum
} from '@model'
import { Logger, mapToObject } from '@utils'

import { ConfiguredOAuth2Provider } from '../apps/oauth2-providers'
import { AppDefinition, AppError, AppRunAuth } from '../apps/types'
import { IntegrationSecrets } from './integration-secrets'

export const INTEGRATION_OAUTH_CALLBACK_PATH = '/api/integrations/oauth/callback'

const ENCRYPTION_KEYS = 'INTEGRATION_ENCRYPTION_KEY or INTEGRATION_ENCRYPTION_KEY_PREVIOUS'
const STATE_TTL = '10m'
const TOKEN_REQUEST_TIMEOUT = 15_000
// Revocation is best effort, so it shouldn't hold up disconnecting
const REVOKE_REQUEST_TIMEOUT = 10_000
// One refresh per connection at a time. Waiting jobs give up after ~30s and
// Bull retries them.
const REVOKE_LOCK_TTL = '10s'
const REFRESH_LOCK_TTL = '30s'
const REFRESH_LOCK_RETRIES = 300
const REFRESH_LOCK_RETRY_DELAY = 100
// Refresh a little before the provider's expiry, so a token doesn't expire
// between being handed to run() and being used
const EXPIRY_MARGIN = 60_000

/**
 * A credential problem that retrying won't fix: the job fails without further
 * attempts. `needsReconnect` means someone has to connect the account (or
 * enter the API key) again; the submission waits until then.
 */
export class IntegrationAuthError extends Error {
  constructor(
    message: string,
    readonly needsReconnect = false
  ) {
    super(message)
    this.name = 'IntegrationAuthError'
  }
}

// A token endpoint error. `code` is the OAuth2 error code (RFC 6749 §5.2) when
// the provider sent one. Messages never include tokens or the response body.
export class OAuth2TokenError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message)
    this.name = 'OAuth2TokenError'
  }
}

interface OAuth2TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  // Granted scopes, space-separated
  scope?: string
}

// The provider's account behind a connection
export interface ConnectedAccount {
  id: string
  email?: string
  name?: string
}

interface StoredTokens {
  accessToken?: string
  refreshToken?: string
  // Milliseconds since the epoch
  expiresAt?: number
}

export interface IntegrationOAuthState {
  appId: string
  formId: string
  userId: string
  // The device whose session started it; the callback must come from it
  deviceId: string
  codeVerifier?: string
}

function base64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function maskApiKey(apiKey: string): string {
  // Only show the end of keys long enough that four characters give little away
  return apiKey.length >= 16 ? `••••${apiKey.slice(-4)}` : '••••'
}

@Injectable()
export class IntegrationAuthService {
  private readonly logger = new Logger(IntegrationAuthService.name)

  constructor(
    private readonly appService: AppService,
    private readonly integrationService: IntegrationService,
    private readonly connectionService: IntegrationConnectionService,
    private readonly redisService: RedisService
  ) {}

  // Encrypts API keys and tokens with INTEGRATION_ENCRYPTION_KEY
  get secrets(): IntegrationSecrets {
    return this.appService.secrets
  }

  get redirectUri(): string {
    return new URL(INTEGRATION_OAUTH_CALLBACK_PATH, APP_HOMEPAGE_URL).toString()
  }

  // --- API keys ---------------------------------------------------------------

  encryptApiKey(apiKey: string): Pick<IntegrationModel, 'apiKey' | 'apiKeyHint'> {
    return {
      apiKey: this.secrets.encrypt(apiKey),
      apiKeyHint: maskApiKey(apiKey)
    }
  }

  // --- OAuth2 connect flow ----------------------------------------------------

  private stateKey(state: string): string {
    return `integration_oauth_state:${state}`
  }

  private requireProvider(app: AppDefinition): ConfiguredOAuth2Provider {
    const provider = this.appService.findOAuth2Provider(app)

    if (!provider || !this.appService.isAvailable(app)) {
      throw new BadRequestException(`${app.name} is not available on this server`)
    }

    return provider
  }

  /**
   * Starts connecting an account: remembers who asked, for which form and app,
   * under a random `state`, and returns the provider's authorize URL.
   */
  async createAuthorization(
    app: AppDefinition,
    formId: string,
    userId: string,
    deviceId: string
  ): Promise<{ url: string; state: string }> {
    const provider = this.requireProvider(app)
    // The identity scopes let the userinfo endpoint say whose account it is
    const scopes = [
      ...new Set([
        ...provider.identityScopes,
        ...(app.auth.type === 'oauth2' ? app.auth.scopes : [])
      ])
    ]
    const state = base64Url(crypto.randomBytes(32))
    const codeVerifier = provider.pkce ? base64Url(crypto.randomBytes(32)) : undefined
    const data: IntegrationOAuthState = { appId: app.id, formId, userId, deviceId, codeVerifier }

    await this.redisService.set({
      key: this.stateKey(state),
      value: JSON.stringify(data),
      duration: STATE_TTL
    })

    const url = new URL(provider.authorizeUrl)

    for (const [key, value] of Object.entries(provider.authorizeParams ?? {})) {
      url.searchParams.set(key, value)
    }

    url.searchParams.set('client_id', provider.clientId)
    url.searchParams.set('redirect_uri', this.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scopes.join(' '))
    url.searchParams.set('state', state)

    if (codeVerifier) {
      url.searchParams.set(
        'code_challenge',
        base64Url(crypto.createHash('sha256').update(codeVerifier).digest())
      )
      url.searchParams.set('code_challenge_method', 'S256')
    }

    return { url: url.toString(), state }
  }

  /**
   * Reads and deletes a pending authorization, so each `state` works once.
   * Rejects a state that was started by another user or on another device.
   */
  async consumeAuthorization(
    state: string,
    userId: string,
    deviceId: string
  ): Promise<IntegrationOAuthState> {
    const value = state ? await this.redisService.getdel(this.stateKey(state)) : null
    let data: IntegrationOAuthState | undefined

    try {
      data = value ? JSON.parse(value) : undefined
    } catch (_) {
      data = undefined
    }

    if (
      !data ||
      !data.formId ||
      !data.appId ||
      data.userId !== userId ||
      !deviceId ||
      data.deviceId !== deviceId
    ) {
      throw new BadRequestException('Invalid OAuth state')
    }

    return data
  }

  /**
   * Exchanges the authorization code, identifies the account and stores its
   * tokens as a connection of the form's team: a new one, or the team's
   * existing connection to the same account. The form's integration then uses
   * it (created pending if there isn't one yet). Returns the connection id.
   */
  async completeAuthorization(
    app: AppDefinition,
    form: { id: string; teamId: string },
    userId: string,
    code: string,
    codeVerifier?: string
  ): Promise<string> {
    const provider = this.requireProvider(app)
    const response = await this.requestToken(provider, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {})
    })
    const account = await this.fetchAccount(provider, response.access_token)
    const requested = app.auth.type === 'oauth2' ? app.auth.scopes : []
    const granted = response.scope ? response.scope.split(/\s+/).filter(Boolean) : requested

    // e.g. a permission unticked on the consent screen
    if (requested.some(scope => !granted.includes(scope))) {
      throw new OAuth2TokenError(`${provider.name} didn't grant all the access ${app.name} needs`)
    }

    const existing = await this.connectionService.findAccount(form.teamId, provider.id, account.id)
    const tokens = this.toStoredTokens(response, existing ? this.readTokens(existing) : undefined)

    // An expiring token that can't be refreshed would look connected, then
    // stop working within the hour
    if (tokens.expiresAt && !tokens.refreshToken) {
      throw new OAuth2TokenError(`${provider.name} did not return a refresh token`)
    }

    const fields = {
      accountEmail: account.email,
      accountName: account.name,
      scopes: [...new Set([...(existing?.scopes ?? []), ...granted])],
      tokens: this.encryptTokens(tokens)
    }
    let connectionId = existing?.id

    if (!connectionId) {
      try {
        connectionId = await this.connectionService.create({
          teamId: form.teamId,
          provider: provider.id,
          accountId: account.id,
          createdBy: userId,
          ...fields
        })
      } catch (err: any) {
        // Someone else in the team connected the same account at that moment
        if (err?.code !== 11000) {
          throw err
        }
      }
    }

    if (!connectionId) {
      connectionId = (await this.connectionService.findAccount(
        form.teamId,
        provider.id,
        account.id
      ))!.id
      await this.connectionService.reconnect(connectionId, fields)
    } else if (existing) {
      // The same account connected again: new tokens, and active again
      await this.connectionService.reconnect(connectionId, fields)
    }

    const integration = await this.integrationService.findOne(form.id, app.id)

    if (integration) {
      await this.integrationService.update(integration.id, { connectionId })
    } else {
      await this.integrationService.create({
        formId: form.id,
        appId: app.id,
        config: {},
        status: IntegrationStatusEnum.PENDING,
        connectionId
      })
    }

    await this.resumeConnection(connectionId!)

    return connectionId!
  }

  /**
   * After an account is connected (again): integrations using it that were
   * waiting for a reconnect become active, and every active one sends the
   * submissions that waited.
   */
  async resumeConnection(connectionId: string): Promise<void> {
    const integrations = await this.integrationService.findAllByConnection(connectionId)

    for (const integration of integrations) {
      let status = integration.status

      if (status === IntegrationStatusEnum.NEEDS_RECONNECT) {
        status = this.hasConfig(integration)
          ? IntegrationStatusEnum.ACTIVE
          : IntegrationStatusEnum.PENDING
        await this.integrationService.update(integration.id, { status })
      }

      if (status === IntegrationStatusEnum.ACTIVE) {
        await this.integrationService.resendWaiting(integration)
      }
    }
  }

  // The account behind an access token, from the provider's userinfo endpoint
  private async fetchAccount(
    provider: ConfiguredOAuth2Provider,
    accessToken: string
  ): Promise<ConnectedAccount> {
    let response: { statusCode: number; body: any }

    try {
      response = await got.get(provider.userInfoUrl, {
        headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
        responseType: 'json',
        throwHttpErrors: false,
        followRedirect: false,
        retry: { limit: 0 },
        timeout: TOKEN_REQUEST_TIMEOUT
      })
    } catch (err: any) {
      // got's errors carry the request headers, which include the token
      throw new OAuth2TokenError(
        `${provider.name} userinfo request failed: ${err?.code || 'network error'}`
      )
    }

    const body = response.body

    if (
      response.statusCode < 200 ||
      response.statusCode >= 300 ||
      typeof body?.sub !== 'string' ||
      !body.sub
    ) {
      throw new OAuth2TokenError(
        `${provider.name} didn't identify the account: HTTP ${response.statusCode}`
      )
    }

    return {
      id: body.sub,
      email: typeof body.email === 'string' ? body.email : undefined,
      name: typeof body.name === 'string' ? body.name : undefined
    }
  }

  // --- Team connections ---------------------------------------------------------

  // Whether the account has granted everything the app asks for
  coversScopes(app: AppDefinition, connection: IntegrationConnectionModel): boolean {
    const requested = app.auth.type === 'oauth2' ? app.auth.scopes : []
    return requested.every(scope => (connection.scopes ?? []).includes(scope))
  }

  // The team's connections the app's provider can use
  async findTeamConnections(
    app: AppDefinition,
    teamId: string
  ): Promise<IntegrationConnectionModel[]> {
    const provider = this.requireProvider(app)
    return this.connectionService.findAllInTeam(teamId, provider.id)
  }

  /**
   * A connection of the team that the app can deliver with. Throws a
   * BadRequestException for another team's or provider's connection, or one
   * that hasn't granted the app's scopes.
   */
  async findUsableConnection(
    app: AppDefinition,
    teamId: string,
    connectionId?: string
  ): Promise<IntegrationConnectionModel> {
    const provider = this.requireProvider(app)
    const connection = connectionId ? await this.connectionService.findById(connectionId) : null

    if (!connection || connection.teamId !== teamId || connection.provider !== provider.id) {
      throw new BadRequestException(`Connect your ${provider.name} account first`)
    }

    if (!this.coversScopes(app, connection)) {
      throw new BadRequestException(
        `Connect the ${provider.name} account again to give ${app.name} access`
      )
    }

    return connection
  }

  /**
   * Disconnects a team's account: revokes the grant at the provider (best
   * effort) and deletes the tokens. Integrations using it need reconnecting,
   * and their submissions wait until another account is picked or this one is
   * connected again. Only the member who connected it or the team owner can.
   */
  async disconnectConnection(
    connection: IntegrationConnectionModel,
    userId: string,
    team: { id: string; ownerId: string }
  ): Promise<void> {
    if (connection.teamId !== team.id) {
      throw new BadRequestException('The account does not exist')
    }

    if (connection.createdBy !== userId && team.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the member who connected the account or the workspace owner can disconnect it'
      )
    }

    const provider = this.appService.findProvider(connection.provider)
    const tokens = this.readTokens(connection)
    const token = tokens?.refreshToken || tokens?.accessToken

    // Some providers (Google, for one) revoke the whole grant, i.e. every
    // token this server holds for the account, so the grant is only revoked
    // when no other workspace has the account connected. Checking and deleting
    // under one lock means two disconnects at once can't each leave the grant
    // to the other.
    const isLast = await this.redisService.withLock(
      `integration_revoke:${connection.provider}:${connection.accountId}`,
      REVOKE_LOCK_TTL,
      async () => {
        const shared = await this.connectionService.accountConnectedElsewhere(
          connection.provider,
          connection.accountId,
          connection.id
        )
        await this.connectionService.delete(connection.id)
        return !shared
      }
    )

    await this.integrationService.detachConnection(connection.id)

    if (!provider?.revokeUrl || !token) {
      return
    }

    if (isLast) {
      await this.revoke(provider, connection, token, !!tokens!.refreshToken)
    } else {
      this.logger.info(
        `Not revoking the ${provider.name} grant of connection ${connection.id}: another workspace has the account connected`
      )
    }
  }

  /**
   * Revokes a grant at the provider (RFC 7009). Never throws: a failed request
   * leaves the grant for the account owner to remove.
   */
  private async revoke(
    provider: ConfiguredOAuth2Provider,
    connection: IntegrationConnectionModel,
    token: string,
    isRefreshToken: boolean
  ) {
    try {
      const response = await got.post(provider.revokeUrl!, {
        form: {
          token,
          token_type_hint: isRefreshToken ? 'refresh_token' : 'access_token',
          client_id: provider.clientId,
          client_secret: provider.clientSecret
        },
        throwHttpErrors: false,
        followRedirect: false,
        retry: { limit: 0 },
        timeout: REVOKE_REQUEST_TIMEOUT
      })

      if (response.statusCode < 200 || response.statusCode >= 300) {
        this.logger.warn(
          `${provider.name} didn't revoke the grant of connection ${connection.id}: HTTP ${response.statusCode}`
        )
      }
    } catch (err: any) {
      // got's errors carry the request body, which includes the token
      this.logger.warn(
        `Revoking the ${provider.name} grant of connection ${connection.id} failed: ${err?.code || 'network error'}`
      )
    }
  }

  // --- Credentials for run() --------------------------------------------------

  /**
   * The `auth` value handed to the app's run(). Throws IntegrationAuthError
   * when retrying can't help.
   */
  async getRunAuth(app: AppDefinition, integration: IntegrationModel): Promise<AppRunAuth> {
    return this.withRunAuth(app, integration, async auth => auth)
  }

  /**
   * Calls `fn` with the integration's credentials, for a delivery. Throws
   * IntegrationAuthError when retrying can't help. See withAccessToken for an
   * access token the app's service rejects.
   */
  async withRunAuth<T>(
    app: AppDefinition,
    integration: IntegrationModel,
    fn: (auth: AppRunAuth) => Promise<T>
  ): Promise<T> {
    // An install problem, not the form owner's: no reconnecting can fix it
    if (app.auth.type !== 'none' && !this.secrets.isConfigured) {
      throw new IntegrationAuthError('INTEGRATION_ENCRYPTION_KEY is not set on this server')
    }

    switch (app.auth.type) {
      case 'apiKey':
        return fn({ type: 'apiKey', apiKey: await this.readApiKey(integration) })

      case 'oauth2': {
        const { provider, connection } = await this.findRunConnection(app, integration)
        return this.withAccessToken(provider, connection, fn)
      }

      default:
        return fn({ type: 'none' })
    }
  }

  /**
   * Calls `fn` with the credentials being saved in the settings form, for the
   * app's validate or an options loader: the API key entered or the saved
   * one, or the picked account's access token. Credential problems become a
   * BadRequestException for the form; a revoked grant still marks the
   * connection as needing reconnection, as in a delivery.
   */
  async withSettingsAuth<T>(
    app: AppDefinition,
    credentials: {
      apiKey?: string
      integration?: IntegrationModel | null
      connection?: IntegrationConnectionModel
    },
    fn: (auth: AppRunAuth) => Promise<T>
  ): Promise<T> {
    try {
      switch (app.auth.type) {
        case 'apiKey': {
          const apiKey =
            credentials.apiKey?.trim() ||
            (credentials.integration?.apiKey
              ? this.decryptApiKey(credentials.integration.apiKey)
              : undefined)

          if (!apiKey) {
            throw new BadRequestException(`${app.auth.label || 'API key'} is required`)
          }

          return await fn({ type: 'apiKey', apiKey })
        }

        case 'oauth2': {
          const provider = this.requireProvider(app)
          const connection = credentials.connection

          if (!connection) {
            throw new BadRequestException(`Connect your ${provider.name} account first`)
          }

          if (connection.status === IntegrationConnectionStatusEnum.NEEDS_RECONNECT) {
            throw new BadRequestException(
              `Reconnect the ${provider.name} account or pick another one first`
            )
          }

          return await this.withAccessToken(provider, connection, fn)
        }

        default:
          return await fn({ type: 'none' })
      }
    } catch (err) {
      // Their messages never include credentials
      if (err instanceof IntegrationAuthError || err instanceof OAuth2TokenError) {
        throw new BadRequestException(err.message)
      }
      throw err
    }
  }

  private decryptApiKey(encrypted: string): string {
    try {
      return this.secrets.decrypt(encrypted)
    } catch (_) {
      throw new BadRequestException("The saved API key can't be read. Enter it again.")
    }
  }

  /**
   * Calls `fn` with a valid access token for the connection. If `fn` throws
   * an AppError marked `unauthorized`, the service rejected a token that
   * hadn't expired yet, e.g. because access was revoked: the token is
   * refreshed and `fn` is called once more. If the provider refuses the
   * refresh, the connection needs reconnecting, as when an expired token
   * can't be refreshed.
   */
  async withAccessToken<T>(
    provider: ConfiguredOAuth2Provider,
    connection: IntegrationConnectionModel,
    fn: (auth: AppRunAuth) => Promise<T>
  ): Promise<T> {
    const accessToken = await this.getConnectionAccessToken(provider, connection)

    try {
      return await fn({ type: 'oauth2', accessToken })
    } catch (err) {
      if (!(err instanceof AppError && err.unauthorized)) {
        throw err
      }

      return fn({
        type: 'oauth2',
        accessToken: await this.getConnectionAccessToken(provider, connection, accessToken)
      })
    }
  }

  private async readApiKey(integration: IntegrationModel): Promise<string> {
    if (!integration.apiKey) {
      throw new IntegrationAuthError('No API key is saved for this integration')
    }

    try {
      return this.secrets.decrypt(integration.apiKey)
    } catch (_) {
      // e.g. INTEGRATION_ENCRYPTION_KEY changed without keeping the old one as
      // INTEGRATION_ENCRYPTION_KEY_PREVIOUS. Like unreadable OAuth2 tokens,
      // the key has to be entered again; submissions wait until then.
      return this.needsReconnect(
        integration,
        `The saved API key can't be decrypted with ${ENCRYPTION_KEYS}`,
        'Enter it again to resume deliveries.'
      )
    }
  }

  /**
   * Returns a valid access token for the integration's connection, refreshing
   * it first if it has expired. If the provider rejects the refresh token,
   * the connection and every active integration using it are marked as
   * needing reconnection.
   */
  async getAccessToken(app: AppDefinition, integration: IntegrationModel): Promise<string> {
    const { provider, connection } = await this.findRunConnection(app, integration)
    return this.getConnectionAccessToken(provider, connection)
  }

  // The integration's connection, if deliveries can use it
  private async findRunConnection(
    app: AppDefinition,
    integration: IntegrationModel
  ): Promise<{ provider: ConfiguredOAuth2Provider; connection: IntegrationConnectionModel }> {
    const provider = this.appService.findOAuth2Provider(app)

    if (!provider) {
      throw new IntegrationAuthError(`${app.name} is not configured on this server`)
    }

    const connection = integration.connectionId
      ? await this.connectionService.findById(integration.connectionId)
      : null

    if (!connection) {
      return this.needsReconnect(integration, `No ${provider.name} account is connected`)
    }

    if (connection.status === IntegrationConnectionStatusEnum.NEEDS_RECONNECT) {
      return this.needsReconnect(
        integration,
        connection.statusReason || `The ${provider.name} account needs reconnecting`
      )
    }

    return { provider, connection }
  }

  /**
   * A valid access token for the connection. Only one refresh runs per
   * connection: a job that finds the token expired while another job is
   * refreshing it waits, then uses the new token. `rejectedToken`, a token
   * the app's service refused, is refreshed even if it hasn't expired.
   */
  async getConnectionAccessToken(
    provider: ConfiguredOAuth2Provider,
    connection: IntegrationConnectionModel,
    rejectedToken?: string
  ): Promise<string> {
    const tokens = this.readTokens(connection)

    if (!rejectedToken && tokens?.accessToken && !this.isExpired(tokens)) {
      return tokens.accessToken
    }

    return this.redisService.withLock(
      `integration_connection_refresh:${connection.id}`,
      REFRESH_LOCK_TTL,
      () => this.refresh(provider, connection.id, rejectedToken),
      REFRESH_LOCK_RETRIES,
      REFRESH_LOCK_RETRY_DELAY
    )
  }

  // Runs under the connection's refresh lock
  private async refresh(
    provider: ConfiguredOAuth2Provider,
    connectionId: string,
    rejectedToken?: string
  ): Promise<string> {
    // Read again: the refresh this job waited for may have done it already
    const connection = await this.connectionService.findById(connectionId)

    if (!connection) {
      throw new IntegrationAuthError(`The ${provider.name} account was disconnected`, true)
    }

    if (connection.status === IntegrationConnectionStatusEnum.NEEDS_RECONNECT) {
      throw new IntegrationAuthError(
        `${connection.statusReason || `The ${provider.name} account needs reconnecting`}. Reconnect the account to resume deliveries.`,
        true
      )
    }

    const tokens = this.readTokens(connection)

    if (!tokens) {
      return this.connectionNeedsReconnect(
        connection,
        `The ${provider.name} tokens can't be decrypted with ${ENCRYPTION_KEYS}`
      )
    }

    if (tokens.accessToken && !this.isExpired(tokens) && tokens.accessToken !== rejectedToken) {
      return tokens.accessToken
    }

    if (!tokens.refreshToken) {
      return this.connectionNeedsReconnect(
        connection,
        rejectedToken
          ? `The ${provider.name} access token was rejected`
          : `The ${provider.name} access token has expired`
      )
    }

    let response: OAuth2TokenResponse

    try {
      response = await this.requestToken(provider, {
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken
      })
    } catch (err) {
      if (err instanceof OAuth2TokenError && err.code === 'invalid_grant') {
        // The account may have been connected again while this ran (the lock
        // only covers refreshes); if so, its new token is good
        const latest = await this.connectionService.findById(connection.id)
        const latestTokens = latest ? this.readTokens(latest) : undefined

        if (
          latest &&
          latest.tokenVersion !== connection.tokenVersion &&
          latestTokens?.accessToken &&
          !this.isExpired(latestTokens)
        ) {
          return latestTokens.accessToken
        }

        return this.connectionNeedsReconnect(connection, err.message)
      }

      if (err instanceof OAuth2TokenError && err.code === 'invalid_client') {
        throw new IntegrationAuthError(err.message)
      }

      // Network errors and provider outages: let the queue retry
      throw err
    }

    const refreshed = this.toStoredTokens(response, tokens)

    // Not stored if the account was connected again meanwhile; this token is
    // still valid for this job
    await this.connectionService.updateTokens(
      connection.id,
      connection.tokenVersion,
      this.encryptTokens(refreshed)
    )

    return refreshed.accessToken!
  }

  /**
   * Marks the connection and its active integrations as needing reconnection,
   * unless the account was connected again since its tokens were read.
   */
  private async connectionNeedsReconnect(
    connection: IntegrationConnectionModel,
    reason: string
  ): Promise<never> {
    if (
      await this.connectionService.markNeedsReconnect(
        connection.id,
        connection.tokenVersion,
        reason
      )
    ) {
      await this.integrationService.markConnectionNeedsReconnect(connection.id)
      this.logger.warn(`Connection ${connection.id} needs reconnecting: ${reason}`)
    }

    throw new IntegrationAuthError(`${reason}. Reconnect the account to resume deliveries.`, true)
  }

  private async needsReconnect(
    integration: IntegrationModel,
    reason: string,
    action = 'Reconnect the account to resume deliveries.'
  ): Promise<never> {
    await this.integrationService.update(integration.id, {
      status: IntegrationStatusEnum.NEEDS_RECONNECT
    })
    this.logger.warn(`Integration ${integration.id} needs reconnecting: ${reason}`)

    throw new IntegrationAuthError(`${reason}. ${action}`, true)
  }

  // --- Tokens -----------------------------------------------------------------

  private hasConfig(integration: IntegrationModel): boolean {
    return Object.keys(mapToObject(integration.config) ?? {}).length > 0
  }

  private isExpired(tokens: StoredTokens): boolean {
    return !!tokens.expiresAt && tokens.expiresAt - EXPIRY_MARGIN <= Date.now()
  }

  private toStoredTokens(response: OAuth2TokenResponse, previous?: StoredTokens): StoredTokens {
    const expiresIn = Number(response.expires_in)

    return {
      accessToken: response.access_token,
      // Providers that don't rotate refresh tokens omit them on refresh
      refreshToken: response.refresh_token || previous?.refreshToken,
      expiresAt: expiresIn > 0 ? Date.now() + expiresIn * 1000 : undefined
    }
  }

  private encryptTokens(tokens: StoredTokens): Record<string, any> {
    const stored: Record<string, any> = {}

    if (tokens.accessToken) {
      stored.accessToken = this.secrets.encrypt(tokens.accessToken)
    }

    if (tokens.refreshToken) {
      stored.refreshToken = this.secrets.encrypt(tokens.refreshToken)
    }

    if (tokens.expiresAt) {
      stored.expiresAt = tokens.expiresAt
    }

    return stored
  }

  // Undefined when the tokens can't be decrypted, e.g. after the key changed
  private readTokens(record: IntegrationConnectionModel): StoredTokens | undefined {
    const stored = mapToObject(record.tokens) ?? {}

    try {
      return {
        accessToken: stored.accessToken ? this.secrets.decrypt(stored.accessToken) : undefined,
        refreshToken: stored.refreshToken ? this.secrets.decrypt(stored.refreshToken) : undefined,
        expiresAt: Number(stored.expiresAt) || undefined
      }
    } catch (_) {
      return undefined
    }
  }

  private async requestToken(
    provider: ConfiguredOAuth2Provider,
    params: Record<string, string>
  ): Promise<OAuth2TokenResponse> {
    let response: { statusCode: number; body: any }

    try {
      response = await got.post(provider.tokenUrl, {
        form: {
          ...params,
          client_id: provider.clientId,
          client_secret: provider.clientSecret
        },
        headers: { accept: 'application/json' },
        responseType: 'json',
        throwHttpErrors: false,
        followRedirect: false,
        retry: { limit: 0 },
        timeout: TOKEN_REQUEST_TIMEOUT
      })
    } catch (err: any) {
      // got's errors carry the request options, which include the client
      // secret and tokens, so only the error code is passed on
      throw new OAuth2TokenError(
        `${provider.name} token request failed: ${err?.code || 'network error'}`
      )
    }

    const body = response.body

    if (
      response.statusCode >= 200 &&
      response.statusCode < 300 &&
      typeof body?.access_token === 'string' &&
      body.access_token
    ) {
      return body
    }

    const code =
      typeof body?.error === 'string' && /^[a-z_]{1,64}$/.test(body.error) ? body.error : undefined

    throw new OAuth2TokenError(
      `${provider.name} rejected the token request: ${code ?? `HTTP ${response.statusCode}`}`,
      code
    )
  }
}
