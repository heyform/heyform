import { BadRequestException, Controller, Get, Query, Req, Res } from '@nestjs/common'
import * as crypto from 'crypto'

import { CookieOptionsFactory } from '@config'
import { Auth, FormGuard, User } from '@decorator'
import { UserModel } from '@model'
import {
  AppService,
  FormService,
  IntegrationAuthService,
  ProjectService,
  TeamService
} from '@service'
import { Logger } from '@utils'

const STATE_COOKIE_NAME = 'HEYFORM_INTEGRATION_OAUTH_STATE'
const STATE_COOKIE_PATH = '/api/integrations/oauth'
const STATE_COOKIE_MAX_AGE = 10 * 60 * 1000

function sameState(a?: string, b?: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Connects an OAuth2 account to a form's integration. The webapp navigates to
 * `authorize`; the provider sends the browser back to `callback`, which is the
 * redirect URI to register with every provider.
 */
@Controller()
@Auth()
export class IntegrationOAuthController {
  private readonly logger = new Logger(IntegrationOAuthController.name)

  constructor(
    private readonly appService: AppService,
    private readonly formService: FormService,
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService,
    private readonly integrationAuthService: IntegrationAuthService
  ) {}

  @Get('/api/integrations/oauth/authorize')
  @FormGuard()
  async authorize(
    @Query('formId') formId: string,
    @Query('appId') appId: string,
    @User() user: UserModel,
    @Res() res: any
  ) {
    const app = typeof appId === 'string' ? this.appService.findById(appId) : undefined

    if (!app || app.auth.type !== 'oauth2') {
      throw new BadRequestException('The app does not exist')
    }

    const { url, state } = await this.integrationAuthService.createAuthorization(
      app,
      formId,
      user.id
    )

    // Ties the callback to this browser as well as to the user, so a link to
    // someone else's authorization can't complete in another session
    res.cookie(
      STATE_COOKIE_NAME,
      state,
      CookieOptionsFactory({
        httpOnly: true,
        maxAge: STATE_COOKIE_MAX_AGE,
        path: STATE_COOKIE_PATH
      })
    )
    res.redirect(302, url)
  }

  @Get('/api/integrations/oauth/callback')
  async callback(
    @Query() query: Record<string, unknown>,
    @User() user: UserModel,
    @Req() req: any,
    @Res() res: any
  ) {
    const state = typeof query.state === 'string' ? query.state : undefined
    const code = typeof query.code === 'string' ? query.code : undefined

    res.clearCookie(
      STATE_COOKIE_NAME,
      CookieOptionsFactory({ httpOnly: true, maxAge: undefined, path: STATE_COOKIE_PATH })
    )

    if (!sameState(state, req.cookies?.[STATE_COOKIE_NAME])) {
      throw new BadRequestException('Invalid OAuth state')
    }

    const pending = await this.integrationAuthService.consumeAuthorization(state!, user.id)
    const form = await this.formService.findById(pending.formId)

    // The same access FormGuard requires, checked again in case it was
    // removed while the user was at the provider
    const [projectMember, teamMember] = form
      ? await Promise.all([
          this.projectService.findMemberById(form.projectId, user.id),
          this.teamService.findMemberById(form.teamId, user.id)
        ])
      : []

    if (!form || !projectMember || !teamMember) {
      throw new BadRequestException('Please make sure you have permission to access this form')
    }

    const page = `/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/integrations`
    const app = this.appService.findById(pending.appId)
    const back = (params: Record<string, string>) =>
      res.redirect(302, `${page}?${new URLSearchParams({ appId: pending.appId, ...params })}`)

    if (!app || !code || query.error) {
      // Only known codes go back to the page; provider text is not reflected
      return back({
        integrationError: query.error === 'access_denied' ? 'access_denied' : 'connect_failed'
      })
    }

    try {
      await this.integrationAuthService.completeAuthorization(
        app,
        { id: form.id, teamId: form.teamId },
        user.id,
        code,
        pending.codeVerifier
      )
    } catch (err: any) {
      // Token errors carry no secrets (see OAuth2TokenError)
      this.logger.error(`Connecting ${app.id} for form ${form.id} failed: ${err?.message}`)
      return back({ integrationError: 'connect_failed' })
    }

    back({ integrationConnected: '1' })
  }
}
