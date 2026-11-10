import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common'

import { STRIPE_CONNECT_SECRET_KEY } from '@environments'
import { helper } from '@heyform-inc/utils'
import { PaymentService, SubmissionService } from '@service'

@Controller()
export class PaymentIntentWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly submissionService: SubmissionService
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

  private async _paymentIntentSucceeded(object: any, stripeAccountId?: string) {
    const { id: paymentIntentId, metadata } = object

    if (helper.isEmpty(metadata) || helper.isEmpty(metadata.submissionId)) {
      throw new BadRequestException('Invalid payment metadata')
    }

    const { submissionId, fieldId } = metadata
    const submission = await this.submissionService.findById(submissionId)

    if (helper.isEmpty(submission)) {
      throw new BadRequestException('Submission not found')
    }

    const answer = submission.answers.find(a => a.id === fieldId)

    if (helper.isEmpty(answer)) {
      throw new BadRequestException('Field not found')
    }

    // Stripe retries an event until it gets a 2xx, so a repeat of one already applied succeeds
    if (answer.value?.paymentIntentId === paymentIntentId) {
      return 'success'
    }

    if (answer.value?.pendingPaymentIntentId !== paymentIntentId) {
      throw new BadRequestException('Invalid payment intent')
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
