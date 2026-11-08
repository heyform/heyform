import {
  Answer,
  CaptchaKindEnum,
  FieldKindEnum,
  SubmissionCategoryEnum,
  SubmissionStatusEnum,
  Variable
} from '@heyform-inc/shared-types-enums'
import { BadRequestException, Headers, UseGuards } from '@nestjs/common'

import { DISABLE_SUBMISSION_IP } from '@environments'
import { CompleteSubmissionInput, CompleteSubmissionType } from '@graphql'
import { EndpointAnonymousIdGuard } from '@guard'
import { applyLogicToFields, fieldValuesToAnswers, flattenFields } from '@heyform-inc/answer-utils'
import { helper, timestamp } from '@heyform-inc/utils'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import {
  EndpointService,
  FormReportService,
  FormService,
  IntegrationService,
  PaymentService,
  SubmissionIpLimitService,
  SubmissionService
} from '@service'
import {
  ClientInfo,
  GqlClient,
  assertFormIsAcceptingSubmissions,
  assertSafeSpecialFieldAnswers,
  collectChoiceLimits,
  isSubmissionDiscarded,
  isTimeLimitUp,
  normalizeSubmissionHiddenFields,
  resolvePaymentConfiguration,
  selectSubmissionFields
} from '@utils'

@Resolver()
@UseGuards(EndpointAnonymousIdGuard)
export class CompleteSubmissionResolver {
  constructor(
    private readonly endpointService: EndpointService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService,
    private readonly submissionIpLimitService: SubmissionIpLimitService,
    private readonly formReportService: FormReportService,
    private readonly integrationService: IntegrationService,
    private readonly paymentService: PaymentService
  ) {}

  @Mutation(returns => CompleteSubmissionType)
  async completeSubmission(
    @GqlClient() client: ClientInfo,
    @Headers('x-anonymous-id') anonymousId: string,
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

    const now = timestamp()
    assertFormIsAcceptingSubmissions(form.settings, now)

    if (helper.isEmpty(form!.fields)) {
      throw new BadRequestException('The form does not have content')
    }

    // Check password
    if (form.settings.requirePassword) {
      const passwordToken = this.endpointService.decryptToken(input.passwordToken)
      this.endpointService.assertFormPasswordToken(
        passwordToken,
        form.id,
        anonymousId,
        form.settings.password!,
        now
      )
    }

    // Start submit time
    const openToken = this.endpointService.decryptToken(input.openToken)
    const isPartialSubmission = input.partialSubmission === true

    const startAt = this.endpointService.assertOpenToken(
      openToken,
      input.formId,
      form.settings,
      now,
      { allowTimeUpGrace: isPartialSubmission }
    )

    // The time limit's own submission (Header.tsx): store what was answered on the route,
    // without the required questions the respondent had no time left for
    const isTimeUp = isPartialSubmission && isTimeLimitUp(form.settings, startAt, now)

    // Bot prevention check
    if (form.settings?.captchaKind !== CaptchaKindEnum.NONE) {
      await this.endpointService.antiBotCheck(form.settings?.captchaKind, input)
    }

    // Verify user submit content
    let answers: Answer[] = []
    let variables: Variable[] = []
    let variableValues: Record<string, any> = {}
    let isDiscarded = false

    try {
      const flattenedFields = flattenFields(form.fields, true)
      const logicResult = applyLogicToFields(
        flattenedFields,
        form.logics,
        form.variables,
        input.answers
      )
      const fields = selectSubmissionFields(
        logicResult.fields,
        form.logics,
        isPartialSubmission,
        isTimeUp
      )
      assertSafeSpecialFieldAnswers(fields, input.answers)
      variableValues = logicResult.variables

      answers = isTimeUp
        ? fieldValuesToAnswers(fields, input.answers, true).filter(answer =>
            helper.isValid(answer.value)
          )
        : fieldValuesToAnswers(fields, input.answers)
      variables = form.variables?.map(variable => ({
        ...variable,
        value: variableValues[variable.id]
      }))
      isDiscarded = isSubmissionDiscarded(form, flattenedFields, input.answers, isPartialSubmission)
    } catch (err) {
      throw new BadRequestException(err.response)
    }

    // The respondent still sees the ending, but nothing is stored or sent on. Likewise when
    // the time ran out before anything valid was answered: there is no response to keep.
    if (isDiscarded || (isTimeUp && answers.length < 1)) {
      return {}
    }

    const isIpLimited =
      form.settings.enableIpLimit &&
      helper.isValid(form.settings.ipLimitCount) &&
      form.settings.ipLimitCount > 0

    // checkIp() counts the submission, so it runs only once the response is going to be stored
    if (isIpLimited) {
      await this.submissionIpLimitService.checkIp(form, client.ip)
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

    // Payment amounts and currencies are always derived from the published form
    // configuration, never from respondent-controlled answer values.
    const paymentAnswers = answers.filter(answer => answer.kind === FieldKindEnum.PAYMENT)

    for (const paymentAnswer of paymentAnswers) {
      const payment = resolvePaymentConfiguration(paymentAnswer.properties, variableValues)
      const billingName = paymentAnswer.value?.billingDetails?.name

      paymentAnswer.value = {
        ...payment,
        billingDetails: {
          name: typeof billingName === 'string' ? billingName : ''
        }
      }
    }

    const paymentAnswer = paymentAnswers[0]

    const quotaLimit =
      form.settings.enableQuotaLimit &&
      helper.isValid(form.settings.quotaLimit) &&
      form.settings.quotaLimit! > 0
        ? form.settings.quotaLimit
        : undefined
    const choiceLimits = collectChoiceLimits(flattenFields(form.fields, true), answers)
    let submissionId: string

    try {
      submissionId = await this.submissionService.createWithinQuota(
        {
          teamId: form.teamId,
          formId: form.id,
          category,
          title: form.name,
          answers,
          hiddenFields: normalizeSubmissionHiddenFields(form.hiddenFields, input.hiddenFields),
          variables,
          startAt,
          endAt,
          ip: DISABLE_SUBMISSION_IP ? undefined : client.ip,
          userAgent: client.userAgent,
          status
        },
        quotaLimit,
        choiceLimits
      )
    } catch (err) {
      // Nothing was stored, so the attempt must not use up the IP limit: a respondent told
      // that an option is full can still pick another one
      if (isIpLimited) {
        await this.submissionIpLimitService.releaseIp(form, client.ip)
      }

      throw err
    }

    // Payment
    const result: CompleteSubmissionType = {}

    if (helper.isValid(paymentAnswer) && helper.isValid(form.stripeAccount)) {
      const paymentIntent = await this.paymentService.createPaymentIntent({
        amount: paymentAnswer.value.amount,
        currency: paymentAnswer.value.currency,
        stripeAccountId: form.stripeAccount.accountId,
        metadata: {
          submissionId,
          fieldId: paymentAnswer.id
        }
      })

      // The webhook only accepts this PaymentIntent for the answer. `paymentIntentId` is set when
      // the payment succeeds, since it's what marks the answer as paid.
      const updated = await this.submissionService.updateAnswer(submissionId, {
        ...paymentAnswer,
        value: {
          ...paymentAnswer.value,
          pendingPaymentIntentId: paymentIntent.id
        }
      })

      if (!updated) {
        throw new BadRequestException('Failed to initialize payment')
      }

      result.clientSecret = paymentIntent.clientSecret
    }

    // Form report Queue
    this.formReportService.addQueue(form.id)

    // Integration Queue
    this.integrationService.addQueue(form, submissionId)

    return result
  }
}
