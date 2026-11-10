import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common'

import { STRIPE_CONNECT_SECRET_KEY } from '@environments'
import { helper } from '@heyform-inc/utils'
import { FormService, PaymentService, SubmissionService } from '@service'
import { Logger } from '@utils'

@Controller()
export class PaymentIntentWebhookController {
  private readonly logger = new Logger(PaymentIntentWebhookController.name)

  constructor(
    private readonly paymentService: PaymentService,
    private readonly submissionService: SubmissionService,
    private readonly formService: FormService
  ) {}

  @Post('/payment/intent/webhook')
  async webhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    let event: any

    try {
      event = this.paymentService.constructEvent(req.body, signature, STRIPE_CONNECT_SECRET_KEY)
    } catch {
      throw new BadRequestException('Invalid signature')
    }

    if (event.type === 'payment_intent.succeeded') {
      return await this._paymentIntentSucceeded(event.data.object, event.account)
    }

    return 'success'
  }

  // Stripe retries a non-2xx for days, so a signed event that will never apply to this form is
  // acknowledged and logged instead of rejected. Only a bad signature is a 4xx.
  private _skip(paymentIntentId: string, reason: string) {
    this.logger.warn(`Ignoring payment_intent ${paymentIntentId}: ${reason}`)

    return 'success'
  }

  private async _paymentIntentSucceeded(object: any, stripeAccountId?: string) {
    const { id: paymentIntentId, metadata } = object

    if (helper.isEmpty(metadata) || helper.isEmpty(metadata.submissionId)) {
      return this._skip(paymentIntentId, 'no submission in its metadata')
    }

    const { submissionId, fieldId } = metadata
    const submission = await this.submissionService.findById(submissionId)

    if (helper.isEmpty(submission)) {
      return this._skip(paymentIntentId, `submission ${submissionId} does not exist`)
    }

    const answer = submission.answers.find(a => a.id === fieldId)

    if (helper.isEmpty(answer)) {
      return this._skip(paymentIntentId, `submission ${submissionId} has no field ${fieldId}`)
    }

    // A repeat of an event already applied succeeds without touching the answer
    if (answer.value?.paymentIntentId === paymentIntentId) {
      return 'success'
    }

    // The respondent paid an intent this answer no longer waits for, e.g. an earlier attempt
    if (
      answer.value?.pendingPaymentIntentId !== paymentIntentId &&
      !(await this._isLegacyPayment(submission.formId, answer.value, object, stripeAccountId))
    ) {
      return this._skip(paymentIntentId, `field ${fieldId} is not waiting for it`)
    }

    const charge = await this._findCharge(object, stripeAccountId)
    const answerValue = { ...answer.value }
    delete answerValue.clientSecret
    delete answerValue.pendingPaymentIntentId

    await this.submissionService.updateAnswer(submissionId, {
      ...answer,
      value: {
        ...answerValue,
        paymentIntentId,
        billingDetails: {
          name: charge?.billing_details?.name ?? answerValue.billingDetails?.name
        },
        receiptUrl: charge?.receipt_url
      }
    })
  }

  // An answer submitted before `pendingPaymentIntentId` existed names no intent. Accept a payment
  // for it only from the form owner's Stripe account and for the amount the answer asked for.
  private async _isLegacyPayment(
    formId: string,
    value: any,
    object: any,
    stripeAccountId?: string
  ): Promise<boolean> {
    if (helper.isEmpty(value) || value.pendingPaymentIntentId || value.paymentIntentId) {
      return false
    }

    if (
      object.amount !== value.amount ||
      String(object.currency).toLowerCase() !== String(value.currency).toLowerCase()
    ) {
      return false
    }

    const form = await this.formService.findById(formId)

    return helper.isValid(stripeAccountId) && form?.stripeAccount?.accountId === stripeAccountId
  }

  // Stripe API versions before 2022-11-15 embed the charges; later ones only name the latest
  private async _findCharge(object: any, stripeAccountId?: string) {
    if (helper.isValid(object.charges?.data)) {
      return object.charges.data[0]
    }

    const chargeId =
      typeof object.latest_charge === 'string' ? object.latest_charge : object.latest_charge?.id

    if (helper.isEmpty(chargeId) || helper.isEmpty(stripeAccountId)) {
      return
    }

    return this.paymentService.retrieveCharge(chargeId, stripeAccountId!)
  }
}
