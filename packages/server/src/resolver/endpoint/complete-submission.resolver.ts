import { BadRequestException, Headers, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { applyLogicToFields, fieldValuesToAnswers, flattenFields } from '@heyform-inc/answer-utils'
import {
  Answer,
  CaptchaKindEnum,
  FieldKindEnum,
  SubmissionCategoryEnum,
  SubmissionStatusEnum,
  Variable
} from '@heyform-inc/shared-types-enums'
import { helper, timestamp } from '@heyform-inc/utils'

import { CompleteSubmissionInput, CompleteSubmissionType } from '@graphql'
import { EndpointAnonymousIdGuard } from '@guard'
import {
  EndpointService,
  FormAnalyticService,
  FormReportService,
  FormService,
  IntegrationService,
  PaymentService,
  SubmissionIpLimitService,
  SubmissionService
} from '@service'
import { GqlClient } from '@utils'
import { ClientInfo } from '@utils'

@Resolver()
@UseGuards(EndpointAnonymousIdGuard)
export class CompleteSubmissionResolver {
  constructor(
    private readonly endpointService: EndpointService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService,
    private readonly submissionIpLimitService: SubmissionIpLimitService,
    private readonly formAnalyticService: FormAnalyticService,
    private readonly formReportService: FormReportService,
    private readonly integrationService: IntegrationService,
    private readonly paymentService: PaymentService
  ) {}

  @Mutation(returns => CompleteSubmissionType)
  async completeSubmission(
    @Headers('x-anonymous-id') anonymousId: string,
    @GqlClient() client: ClientInfo,
    @Args('input') input: CompleteSubmissionInput
  ): Promise<CompleteSubmissionType> {
    const form = await this.formService.findById(input.formId)

    if (!form) {
      throw new BadRequestException('The form does not exist')
    }

    if (form.suspended) {
      throw new BadRequestException('The form is suspended')
    }

    if (form.settings.active !== true) {
      throw new BadRequestException('The form does not active')
    }

    if (helper.isEmpty(form!.fields)) {
      throw new BadRequestException('The form does not have content')
    }

    if (
      form.settings.enableQuotaLimit &&
      helper.isValid(form.settings.quotaLimit) &&
      form.settings.quotaLimit > 0
    ) {
      const count = await this.submissionService.countInForm(input.formId)

      if (count >= form.settings.quotaLimit) {
        throw new BadRequestException(
          'The submission quota exceeds, new submissions are no longer accepted'
        )
      }
    }

    if (
      form.settings.enableIpLimit &&
      helper.isValid(form.settings.ipLimitCount) &&
      form.settings.ipLimitCount > 0
    ) {
      await this.submissionIpLimitService.checkIp(form, client.ip)
    }

    // Check password
    if (form.settings.requirePassword) {
      const { password } = this.endpointService.decryptToken(input.passwordToken)

      if (password !== form.settings.password) {
        throw new BadRequestException('The password does not match')
      }
    }

    // Start submit time
    const { timestamp: startAt } = this.endpointService.decryptToken(input.openToken)

    // Bot prevention check
    if (form.settings?.captchaKind !== CaptchaKindEnum.NONE) {
      await this.endpointService.antiBotCheck(form.settings?.captchaKind, input)
    }

    // Verify user submit content
    let answers: Answer[] = []
    let variables: Variable[] = []

    try {
      const { fields, variables: variableValues } = applyLogicToFields(
        flattenFields(form.fields, true),
        form.logics,
        form.variables,
        input.answers
      )

      answers = fieldValuesToAnswers(fields, input.answers, input.partialSubmission)
      variables = form.variables?.map(variable => ({
        ...variable,
        value: variableValues[variable.id]
      }))
    } catch (err) {
      throw new BadRequestException(err.response)
    }

    let category = SubmissionCategoryEnum.INBOX
    let status = SubmissionStatusEnum.PUBLIC

    // Spam check
    if (form.settings?.filterSpam) {
      const isSpam = await this.endpointService.verifySpam({
        answers,
        ip: client.ip
      })

      if (isSpam) {
        category = SubmissionCategoryEnum.SPAM
      }
    }

    // Notification and Webhook still need the submission data
    // even archive settings have been disabled
    if (!form.settings?.allowArchive) {
      status = SubmissionStatusEnum.PRIVATE
    }

    const endAt = timestamp()

    const submissionId = await this.submissionService.create({
      teamId: form.teamId,
      formId: form.id,
      category,
      title: form.name,
      answers,
      variables,
      startAt,
      endAt,
      ip: client.ip,
      userAgent: client.userAgent,
      status
    })

    // Payment
    const answer = answers.find(a => a.kind === FieldKindEnum.PAYMENT)
    const result: CompleteSubmissionType = {}

    if (helper.isValid(answer) && helper.isValid(form.stripeAccount)) {
      result.clientSecret = await this.paymentService.createPaymentIntent({
        amount: answer.value.amount,
        currency: answer.value.currency,
        stripeAccountId: form.stripeAccount.accountId,
        metadata: {
          submissionId,
          fieldId: answer.id
        }
      })

      await this.submissionService.updateAnswer(submissionId, {
        ...answer,
        value: {
          ...answer.value,
          clientSecret: result.clientSecret
        }
      })
    }

    // Update analytic
    const duration = endAt - startAt
    this.formAnalyticService.updateCountAndAverageTime(form.id, duration)

    // Form report Queue
    this.formReportService.addQueue(form.id)

    // Integration Queue
    this.integrationService.addQueue(form.id, submissionId)

    return result
  }
}
