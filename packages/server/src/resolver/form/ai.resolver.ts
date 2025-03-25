import { Auth, Form, FormGuard, ProjectGuard, Team, User } from '@decorator'
import {
  CreateFieldsWithAIInput,
  CreateFormThemeWithAIInput,
  CreateFormWithAIInput
} from '@graphql'
import {
  CaptchaKindEnum,
  FormKindEnum,
  FormStatusEnum
} from '@heyform-inc/shared-types-enums'
import { helper, hs, parseJson } from '@heyform-inc/utils'
import { FormModel, TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, OpenAIService } from '@service'
import { Throttle } from '@nestjs/throttler'
import * as template from 'art-template'
import {
  CREATE_FIELDS_PROMPT,
  CREATE_FORM_PROMPT,
  LOGIC_PROMPT,
  THEME_PROMPT
} from '@config'
import {
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'
import { Logger } from '@utils'
import { GraphQLJSONObject } from 'graphql-type-json'

@Resolver()
@Auth()
export class AIResolver {
  private readonly logger = new Logger(AIResolver.name)

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly formService: FormService
  ) {}

  /**
   * Create form with AI
   */
  @Mutation(returns => String)
  @ProjectGuard()
  @Throttle(10, hs('1h'))
  async createFormWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: CreateFormWithAIInput
  ) {
    // if (!team.plan.aiForm) {
    //   throw new BadRequestException('Upgrade your plan to create form with AI')
    // }

    const result = await this.openAIService.chatCompletion({
      messages: [
        {
          role: 'user',
          content: template.render(CREATE_FORM_PROMPT, {
            topic: input.topic,
            reference: input.reference
          })
        }
      ]
    })

    this.logger.info(result)

    const content = result.choices[0]?.message?.content

    if (helper.isEmpty(content)) {
      throw new InternalServerErrorException(
        'Failed to generate question content'
      )
    }

    interface AIJson {
      name: string
      fields: unknown
      // or whatever types they actually have
    }

    const json = parseJson(content) as AIJson

    if (!helper.isObject(json)) {
      throw new InternalServerErrorException(
        'Failed to generate question object'
      )
    }

    return await this.formService.create({
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: json.name,
      fields: [],
      _drafts: JSON.stringify(json.fields),
      fieldsUpdatedAt: 0,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true
      },
      hiddenFields: [],
      version: 0,
      kind: FormKindEnum.SURVEY,
      status: FormStatusEnum.NORMAL
    })
  }

  /**
   * Create fields with AI
   */
  @Mutation(returns => [GraphQLJSONObject])
  @FormGuard()
  async createFieldsWithAI(
    @Team() team: TeamModel,
    @Form() form: FormModel,
    @Args('input') input: CreateFieldsWithAIInput
  ) {
    const result = await this.openAIService.chatCompletion({
      messages: [
        {
          role: 'user',
          content: template.render(CREATE_FIELDS_PROMPT, {
            name: form.name,
            questions: parseJson(form._drafts),
            prompt: input.prompt
          })
        }
      ]
    })

    this.logger.info(result)

    const content = result.choices[0]?.message?.content

    if (helper.isEmpty(content)) {
      throw new InternalServerErrorException('Failed to create field content')
    }

    const fields = parseJson(content)

    if (!helper.isValidArray(fields)) {
      throw new InternalServerErrorException('Failed to create fields')
    }

    return fields
  }

  /**
   * Create logics with AI
   */
  @Mutation(returns => [GraphQLJSONObject])
  @FormGuard()
  async createFormLogicsWithAI(
    @Team() team: TeamModel,
    @Form() form: FormModel,
    @Args('input') input: CreateFieldsWithAIInput
  ) {
    if (!team.plan.aiForm) {
      throw new BadRequestException('Upgrade your plan to setup logics with AI')
    }

    const result = await this.openAIService.chatCompletion({
      messages: [
        {
          role: 'user',
          content: template.render(LOGIC_PROMPT, {
            questions: parseJson(form._drafts),
            logics: form.logics,
            prompt: input.prompt
          })
        }
      ]
    })

    this.logger.info(result)

    const content = result.choices[0]?.message?.content

    if (helper.isEmpty(content)) {
      throw new InternalServerErrorException('Failed to generate logic content')
    }

    const logics = parseJson(content)

    if (!helper.isValidArray(logics)) {
      throw new InternalServerErrorException('Failed to generate logics')
    }

    return logics
  }

  /**
   * Create theme with AI
   */
  @Mutation(returns => GraphQLJSONObject)
  @FormGuard()
  async createFormThemeWithAI(
    @Team() team: TeamModel,
    @Args('input') input: CreateFormThemeWithAIInput
  ) {
    if (!team.plan.themeCustomization) {
      throw new BadRequestException(
        'Upgrade your plan to setup theme customization'
      )
    }

    if (!team.plan.aiForm) {
      throw new BadRequestException('Upgrade your plan to setup theme with AI')
    }

    const result = await this.openAIService.chatCompletion({
      messages: [
        {
          role: 'user',
          content: template.render(THEME_PROMPT, {
            theme: input.theme
          })
        }
      ]
    })

    this.logger.info(result)

    const content = result.choices[0]?.message?.content

    if (helper.isEmpty(content)) {
      throw new InternalServerErrorException('Failed to create theme content')
    }

    const json = parseJson(content)

    if (!helper.isObject(json)) {
      throw new InternalServerErrorException('Failed to create theme')
    }

    return json
  }
}
