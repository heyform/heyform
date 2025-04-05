/**
 * App connect
 *
 * /connect/stripe/callback
 * /connect/oauth2/callback
 * /connect/:kind
 * /connect/:kind/callback
 */
export { ConnectStripeController } from './connect-stripe.controller'
export { ThirdPartyAuthorizeController } from './third-party-authorize.controller'
export { SocialLoginController } from './social-login.controller'

/**
 * Payment
 *
 * /payment/stripe/webhook
 * /payment/payment-intent/webhook
 * /connect-stripe
 */
export { StripeWebhookController } from './payment/stripe-webhook.controller'
export { PaymentIntentWebhookController } from './payment/payment-intent-webhook.controller'

/**
 * Export submissions csv
 *
 * /export/submissions
 */
export { ExportSubmissionsController } from './export-submissions.controller'

/**
 * CDN Callback
 *
 * /cdn/callback
 * /api/image
 * /api/upload
 */
export { CallbackController } from './cdn/callback.controller'
export { ImageController } from './image.controller'
export { UploadController } from './upload.controller'

/**
 * Chat
 *
 * /api/chat
 */
export { ChatController } from './chat.controller'

/**
 * Auth
 *
 * /sign-up
 * /logout
 */
export { SignUpController } from './sign-up.controller'
export { LogoutController } from './logout.controller'

/**
 * The dashboard controller must be put at the end,
 * cause the dashboard route is "/*"
 */
export { DashboardController } from './dashboard.controller'
