import { AppConfig, AppError, defineApp } from './types'

// Privatus Analytics site IDs look like `pa_Z6RY7F45OA`
export const PRIVATUS_SITE_ID_PATTERN = /^pa_[A-Za-z0-9]{1,64}$/

export function normalizeSiteId(value: unknown): string {
  const siteId = typeof value === 'string' ? value.trim() : ''

  if (!PRIVATUS_SITE_ID_PATTERN.test(siteId)) {
    throw new AppError('Enter a site ID that starts with pa_, e.g. pa_Z6RY7F45OA', {
      retryable: false
    })
  }

  return siteId
}

export default defineApp({
  id: 'privatusanalytics',
  name: 'Privatus Analytics',
  description:
    'See how many people view and submit your form, and where they come from. Privatus Analytics uses no cookies, so visitors are not asked to accept any.',
  icon: '/static/privatusanalytics.png',
  settings: [
    {
      type: 'text',
      name: 'siteId',
      label: 'Site ID',
      description:
        'Copy it from the tracking code Privatus Analytics gives you, where it says data-site. It starts with pa_.',
      placeholder: 'pa_XXXXXXXXXX',
      required: true
    }
  ],
  validate: async (config: AppConfig) => ({ ...config, siteId: normalizeSiteId(config.siteId) }),
  // The site ID is public: it's in the page of every site that uses Privatus Analytics
  page: config => ({ siteId: normalizeSiteId(config.siteId) })
})
