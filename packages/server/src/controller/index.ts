/**
 * App connect
 *
 * /connect/stripe/callback
 * /connect/oauth2/callback
 * /connect/:kind
 * /connect/:kind/callback
 */
export * from './connect-stripe.controller'
export * from './third-party-authorize.controller'
export * from './social-login.controller'

/**
 * Payment
 *
 * /payment/stripe/webhook
 * /payment/payment-intent/webhook
 * /connect-stripe
 */
export * from './payment/stripe-webhook.controller'
export * from './payment/payment-intent-webhook.controller'

/**
 * Export submissions csv
 *
 * /export/submissions
 */
export * from './export-submissions.controller'

/**
 * CDN Callback
 *
 * /cdn/callback
 * /api/image
 */
export * from './cdn/callback.controller'
export * from './image.controller'
/**
 * Custom domain records verification
 *
 * /custom-domain-verification
 */
export * from './custom-domain-verification.controller'

export * from './internal-api/larkbot.controller'
export * from './internal-api/espocrm.controller'
export * from './public-api/users-count.controller'

/**
 * Changelog
 *
 * /api/changelog
 */
export * from './changelog.controller'

/**
 * Chat
 *
 * /api/chat
 */
export * from './chat.controller'

/**
 * Auth
 *
 * /sign-up
 * /logout
 */
export * from './sign-up.controller'
export * from './logout.controller'

/**
 * The dashboard controller must be put at the end,
 * cause the dashboard route is "/*"
 */
export * from './dashboard.controller'
