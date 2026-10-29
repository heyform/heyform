/**
 * Loaders for page apps: integrations that run in the respondent's browser on
 * the public form page, such as analytics. The server sends what each active
 * page app needs in `form.integrations`, keyed by app id (see `page()` in the
 * server's `src/apps/types.ts`), and only apps with a loader here are loaded.
 */

export type PageAppEvent = 'FORM_OPENED' | 'FORM_SUBMITTED'

interface PageAppContext {
  formId: string
  formName?: string
}

interface PageApp {
  load(config: Record<string, string>, ctx: PageAppContext): void
  track?(event: PageAppEvent, ctx: PageAppContext): void
}

export const PRIVATUS_SITE_ID_PATTERN = /^pa_[A-Za-z0-9]{1,64}$/
export const PRIVATUS_SCRIPT_URL = 'https://privatusstats.com/js/pa.js'

const PRIVATUS_EVENTS: Record<PageAppEvent, string> = {
  FORM_OPENED: 'Form opened',
  FORM_SUBMITTED: 'Form submitted'
}

export const pageApps: Record<string, PageApp> = {
  privatusanalytics: {
    load(config) {
      const siteId = config?.siteId

      if (typeof siteId !== 'string' || !PRIVATUS_SITE_ID_PATTERN.test(siteId)) {
        return
      }

      if (document.getElementById('privatus-analytics')) {
        return
      }

      const script = document.createElement('script')
      script.id = 'privatus-analytics'
      script.src = PRIVATUS_SCRIPT_URL
      script.defer = true
      script.dataset.site = siteId
      // Not `auto`, whose own form submit event would count every submit
      // click, even one that fails validation. FORM_SUBMITTED below is sent
      // once the submission is saved.
      script.dataset.modules = 'engage,vitals,clicks,ask'
      document.head.appendChild(script)
    },

    track(event, { formId, formName }) {
      const args = [PRIVATUS_EVENTS[event], { form_id: formId, form_name: formName }]
      const privatus = window.privatus

      if (typeof privatus?.track === 'function') {
        privatus.track(...args)
        return
      }

      // pa.js loads with defer, and sends what was queued here once it has
      window.privatus = Array.isArray(privatus?.q) ? privatus : { q: [] }
      window.privatus.q.push(['track', args])
    }
  }
}

function activePageApps(integrations: unknown): Array<[PageApp, Record<string, string>]> {
  if (!integrations || typeof integrations !== 'object') {
    return []
  }

  return Object.entries(integrations as Record<string, Record<string, string>>)
    .filter(([id]) => Object.prototype.hasOwnProperty.call(pageApps, id))
    .map(([id, config]) => [pageApps[id], config])
}

// A page app that fails must never stop the form from working
function safely(fn: () => void) {
  try {
    fn()
  } catch (err) {
    console.error(err)
  }
}

export function loadPageApps(integrations: unknown, ctx: PageAppContext) {
  for (const [app, config] of activePageApps(integrations)) {
    safely(() => app.load(config, ctx))
  }
}

export function trackPageApps(integrations: unknown, event: PageAppEvent, ctx: PageAppContext) {
  for (const [app] of activePageApps(integrations)) {
    if (app.track) {
      safely(() => app.track!(event, ctx))
    }
  }
}
