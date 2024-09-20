/**
 * Health
 *
 * /health
 */
export * from './health.controller'

/**
 * App connect
 *
 * /connect/stripe/callback
 * /connect/:kind
 * /connect/:kind/callback
 */
export * from './connect-stripe.controller'
export * from './social-login.controller'

/**
 * Payment
 *
 * /payment/intent/webhook
 */
export * from './payment-intent-webhook.controller'

/**
 * Export submissions csv
 *
 * /export/submissions
 */
export * from './export-submissions.controller'

/**
 * File
 *
 * /image
 * /upload
 */
export * from './image.controller'
export * from './upload.controller'

/**
 * Form
 *
 * /form/* (must be put before dashboard controller)
 */
export * from './form.controller'

/**
 * The dashboard controller must be put at the end,
 * cause the dashboard route is "/*"
 */
export * from './dashboard.controller'
