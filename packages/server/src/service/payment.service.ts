import { BadRequestException, Injectable } from '@nestjs/common'
import Stripe from 'stripe'

import { STRIPE_CONNECT_CLIENT_ID, STRIPE_SECRET_KEY, STRIPE_VERSION } from '@environments'

interface PaymentIntentOptions {
  amount: number
  currency: string
  stripeAccountId: string
  metadata?: Record<string, string>
}

@Injectable()
export class PaymentService {
  private readonly stripe!: Stripe

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_VERSION as any,
      maxNetworkRetries: 2
    })
  }

  getAuthorizeUrl(state: string, email: string): string {
    return this.stripe.oauth.authorizeUrl({
      client_id: STRIPE_CONNECT_CLIENT_ID,
      response_type: 'code',
      scope: 'read_write',
      state,
      stripe_user: {
        email
      }
    })
  }

  async getConnectAccount(code: string) {
    const result = await this.stripe.oauth.token({
      grant_type: 'authorization_code',
      code
    })

    const accountId = result.stripe_user_id
    const account = await this.stripe.accounts.retrieve(accountId)

    if (!account.charges_enabled || !account.details_submitted) {
      throw new BadRequestException('Something went wrong, please try again.')
    }

    return {
      accountId,
      email: account.email || account.settings?.dashboard?.display_name || accountId
    }
  }

  async createPaymentIntent(options: PaymentIntentOptions): Promise<string> {
    const result = await this.stripe.paymentIntents.create(
      {
        amount: options.amount,
        currency: options.currency,
        metadata: options.metadata
      },
      {
        stripeAccount: options.stripeAccountId
      }
    )

    return result.client_secret
  }

  constructEvent(payload: Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }
}
