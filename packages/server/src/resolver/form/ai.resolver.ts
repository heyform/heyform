import {
  CaptchaKindEnum,
  FormKindEnum,
  FormStatusEnum,
  InteractiveModeEnum
} from '@heyform-inc/shared-types-enums'
import { BadRequestException, InternalServerErrorException, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'

import { normalizeAIFields } from '../../utils/ai-fields'
import {
  createFieldsPrompt,
  createFormPrompt,
  createLogicsPrompt,
  createThemePrompt
} from '@config'
import { Auth, Form, FormGuard, ProjectGuard, Team, User } from '@decorator'
import {
  CreateFieldsWithAIInput,
  CreateFormThemeWithAIInput,
  CreateFormWithAIInput
} from '@graphql'
import { GqlThrottlerGuard } from '@guard'
import { helper, ms, parseJson } from '@heyform-inc/utils'
import { FormModel, TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, OpenAIService, RedisService } from '@service'
import { Logger, parseAIJson } from '@utils'
import { GraphQLJSONObject } from 'graphql-type-json'

interface AIFormResult {
  name?: string
  fields?: unknown[]
}

interface TeamPlan {
  aiForm?: boolean
  themeCustomization?: boolean
}

type TeamWithPlan = TeamModel & {
  plan?: TeamPlan
}

const AI_USER_HOURLY_LIMIT = 20
const AI_TEAM_HOURLY_LIMIT = 100
const AI_RATE_LIMIT_DURATION = '1h'

@Resolver()
@Auth()
@UseGuards(GqlThrottlerGuard)
@Throttle({
  default: {
    limit: AI_USER_HOURLY_LIMIT,
    ttl: ms(AI_RATE_LIMIT_DURATION)
  }
})
export class AIResolver {
  private readonly logger = new Logger(AIResolver.name)

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly formService: FormService,
    private readonly redisService: RedisService
  ) {}

  @Mutation(returns => String)
  @ProjectGuard()
  async createFormWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: CreateFormWithAIInput
  ): Promise<string> {
    if (!this.getPlan(team).aiForm) {
      throw new BadRequestException('Upgrade your plan to create form with AI')
    }

    await this.enforceAIUsageLimits(team.id, user.id)

    const json = await this.createAIJson<AIFormResult>(
      createFormPrompt(input.topic, input.reference),
      'Failed to generate question object'
    )

    if (!helper.isObject(json) || !helper.isValidArray(json.fields)) {
      throw new InternalServerErrorException('Failed to generate question object')
    }

    return this.formService.create({
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: typeof json.name === 'string' && json.name.trim() ? json.name.trim() : input.topic,
      fields: [],
      _drafts: JSON.stringify(
        this.normalizeFields(json.fields, 'Failed to generate question object')
      ),
      fieldsUpdatedAt: 0,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true,
        enableEmailNotification: true
      },
      hiddenFields: [],
      version: 0,
      kind: FormKindEnum.SURVEY,
      interactiveMode: InteractiveModeEnum.GENERAL,
      status: FormStatusEnum.NORMAL
    })
  }

  @Mutation(returns => [GraphQLJSONObject])
  @FormGuard()
  async createFieldsWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Form() form: FormModel,
    @Args('input') input: CreateFieldsWithAIInput
  ): Promise<Record<string, unknown>[]> {
    if (!this.getPlan(team).aiForm) {
      throw new BadRequestException('Upgrade your plan to edit form with AI')
    }

    await this.enforceAIUsageLimits(team.id, user.id)

    const fields = await this.createAIJson<Record<string, unknown>[]>(
      createFieldsPrompt(form.name, parseJson(form._drafts), input.prompt),
      'Failed to create fields'
    )

    if (!helper.isValidArray(fields)) {
      throw new InternalServerErrorException('Failed to create fields')
    }

    return this.normalizeFields(fields, 'Failed to create fields')
  }

  @Mutation(returns => [GraphQLJSONObject])
  @FormGuard()
  async createFormLogicsWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Form() form: FormModel,
    @Args('input') input: CreateFieldsWithAIInput
  ): Promise<Record<string, unknown>[]> {
    if (!this.getPlan(team).aiForm) {
      throw new BadRequestException('Upgrade your plan to setup logics with AI')
    }

    await this.enforceAIUsageLimits(team.id, user.id)

    const logics = await this.createAIJson<Record<string, unknown>[]>(
      createLogicsPrompt(parseJson(form._drafts), form.logics, input.prompt),
      'Failed to generate logics'
    )

    if (!helper.isValidArray(logics)) {
      throw new InternalServerErrorException('Failed to generate logics')
    }

    return logics
  }

  @Mutation(returns => GraphQLJSONObject)
  @FormGuard()
  async createFormThemeWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: CreateFormThemeWithAIInput
  ): Promise<Record<string, unknown>> {
    const plan = this.getPlan(team)

    if (!plan.themeCustomization) {
      throw new BadRequestException('Upgrade your plan to setup theme customization')
    }

    if (!plan.aiForm) {
      throw new BadRequestException('Upgrade your plan to setup theme with AI')
    }

    await this.enforceAIUsageLimits(team.id, user.id)

    const theme = await this.createAIJson<Record<string, unknown>>(
      createThemePrompt(input.theme, input.prompt),
      'Failed to create theme'
    )

    if (!helper.isObject(theme)) {
      throw new InternalServerErrorException('Failed to create theme')
    }

    return theme
  }

  private getPlan(team: TeamModel): TeamPlan {
    return (team as TeamWithPlan).plan ?? { aiForm: true, themeCustomization: true }
  }

  private normalizeFields(fields: unknown, errorMessage: string): Record<string, unknown>[] {
    try {
      return normalizeAIFields(fields)
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(errorMessage)
    }
  }

  private async enforceAIUsageLimits(teamId: string, userId: string): Promise<void> {
    await this.redisService.throttler(
      `ai:user:${userId}`,
      AI_USER_HOURLY_LIMIT,
      AI_RATE_LIMIT_DURATION
    )
    await this.redisService.throttler(
      `ai:team:${teamId}`,
      AI_TEAM_HOURLY_LIMIT,
      AI_RATE_LIMIT_DURATION
    )
  }

  private async createAIJson<T>(prompt: string, errorMessage: string): Promise<T> {
    const result = await this.openAIService.chatCompletion({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    const content = result.choices[0]?.message?.content

    this.logger.info(content)

    if (helper.isEmpty(content)) {
      throw new InternalServerErrorException(errorMessage)
    }

    try {
      return parseAIJson<T>(content)
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(errorMessage)
    }
  }
}
