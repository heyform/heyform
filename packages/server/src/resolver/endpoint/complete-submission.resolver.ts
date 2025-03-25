import { CompleteSubmissionInput, CompleteSubmissionType } from '@graphql'
import { EndpointAnonymousIdGuard } from '@guard'
import {
  applyLogicToFields,
  fieldValuesToAnswers,
  flattenFields
} from '@heyform-inc/answer-utils'
import {
  Answer,
  CaptchaKindEnum,
  FieldKindEnum,
  SubmissionCategoryEnum,
  SubmissionStatusEnum,
  Variable
} from '@heyform-inc/shared-types-enums'
import { helper, timestamp } from '@heyform-inc/utils'
import { BadRequestException, Headers, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import {
  EndpointService,
  FormReportService,
  FormService,
  IntegrationService,
  QueueService,
  SubmissionIpLimitService,
  SubmissionService
} from '@service'
import { ClientInfo, GqlClient } from '@decorator'

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
    private readonly queueService: QueueService
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

    // const team = await this.teamService.findWithPlanById(form.teamId)

    /**
     * If team subscription has expired, submit submission is prohibited
     */
    // if (team.subscription.status !== SubscriptionStatusEnum.ACTIVE) {
    //   throw new BadRequestException('The workspace subscription expired')
    // }

    // const submissionQuota = await this.submissionService.countAllInTeam(team.id)

    /**
     * If the submission limit in the plan equals `-1`,
     * then the number of submissions will not be limited
     */
    // Refactor at Jan 2, 2024

    // Discard at Dec 20, 2021 (v2021.12.3)
    // /**
    //  * If the submission limit in the plan equals `-1`,
    //  * then the number of submissions will not be limited
    //  */
    // if (
    //   team.submissionQuota >= team.plan.submissionLimit &&
    //   team.plan.submissionLimit !== -1
    // ) {
    //   throw new BadRequestException(
    //     'The submission quota exceeds, new submissions are no longer accepted'
    //   )
    // }

    // 检查是否超出了 form 自定义的可以接收的的数量
    // if (
    //   form.settings.enableQuotaLimit &&
    //   helper.isValid(form.settings.quotaLimit) &&
    //   form.settings.quotaLimit > 0
    // ) {
    //   const count = await this.submissionService.countInForm(input.formId)

    //   if (count >= form.settings.quotaLimit) {
    //     throw new BadRequestException(
    //       'The submission quota exceeds, new submissions are no longer accepted'
    //     )
    //   }
    // }

    // 检查是否有 IP 限制
    if (
      form.settings.enableIpLimit &&
      helper.isValid(form.settings.ipLimitCount) &&
      form.settings.ipLimitCount > 0
    ) {
      await this.submissionIpLimitService.checkIp(form, client.ip)
    }

    // Check password
    if (form.settings.requirePassword) {
      const { password } = this.endpointService.decryptToken(
        input.passwordToken
      )

      if (password !== form.settings.password) {
        throw new BadRequestException('The password does not match')
      }
    }

    // Start submit time
    const { timestamp: startAt } = this.endpointService.decryptToken(
      input.openToken
    )

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

      answers = fieldValuesToAnswers(
        fields,
        input.answers,
        input.partialSubmission
      )
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

    // Discard at Dec 20, 2021 (v2021.12.3)
    // // 自增 submission 使用数量
    // await this.teamService.update(form.teamId, {
    //   $inc: {
    //     submissionQuota: 1
    //   }
    // })

    // TODO - add transaction
    const endAt = timestamp()

    const submissionId = await this.submissionService.create({
      teamId: form.teamId,
      formId: form.id,
      category,
      // 关联 contact
      // TODO - 检察 contact 是否存在于 team 中
      contactId: input.contactId,
      title: form.name,
      answers,
      hiddenFields: input.hiddenFields,
      variables,
      startAt,
      endAt,
      ip: client.ip,
      geoLocation: client.geoLocation,
      userAgent: client.userAgent,
      status
    })

    // Payment
    const answer = answers.find(a => a.kind === FieldKindEnum.PAYMENT)
    const result: CompleteSubmissionType = {}

    if (helper.isValid(answer)) {
      // const amount = answer.value.amount
      // const applicationFeeAmount = Big(answer.value.amount)
      //   .times(team.plan?.commissionRate)
      //   .toNumber()
      const applicationFeeAmount = 0

      // result.clientSecret = await this.paymentService.createPaymentIntent({
      //   amount,
      //   currency: answer.value.currency,
      //   applicationFeeAmount,
      //   stripeAccountId: form.stripeAccount.accountId,
      //   metadata: {
      //     submissionId,
      //     fieldId: answer.id
      //   }
      // })

      await this.submissionService.updateAnswer(submissionId, {
        ...answer,
        value: {
          ...answer.value,
          applicationFeeAmount,
          clientSecret: result.clientSecret
        }
      })
    }

    // Form report Queue
    this.formReportService.addQueue(form.id)

    // Email notification Queue
    // @ts-ignore
    if (form.settings?.enableEmailNotification) {
      this.queueService.addEmailQueue(form.id, submissionId)
    }

    // Integration Queue
    this.integrationService.addQueue(form.id, submissionId)

    return result
  }
}
