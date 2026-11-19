import { useEffect, useRef, useState } from 'react'
import { useParam } from '@/utils'

export default function WorkspaceApiDocumentation() {
  const { workspaceId } = useParam()
  const container = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open || !container.current) return
    const node = container.current
    const abort = new AbortController()
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = '/static/swagger/swagger-ui.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = '/static/swagger/swagger-ui-bundle.js'
    const url = '/api/v1/workspaces/' + encodeURIComponent(workspaceId) + '/api/documentation'
    script.onload = async () => {
      try {
        const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: abort.signal })
        if (!response.ok) throw new Error('Documentation access denied')
        const spec = await response.json()
        if (abort.signal.aborted) return
        const swagger = (window as any).SwaggerUIBundle
        swagger({ spec, domNode: node, persistAuthorization: false, validatorUrl: null,
          supportedSubmitMethods: ['get', 'post', 'patch', 'delete'],
          requestInterceptor: (request: any) => {
            const target = new URL(request.url, window.location.origin)
            if (target.origin !== window.location.origin || !target.pathname.startsWith('/api/v1/')) throw new Error('Only local REST API requests are permitted')
            request.credentials = 'omit'
            return request
          }
        })
      } catch (e) {
        if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load documentation')
      }
    }
    script.onerror = () => { if (!abort.signal.aborted) setError('Unable to load local Swagger assets') }
    document.head.appendChild(script)
    return () => { abort.abort(); script.remove(); css.remove(); node.replaceChildren() }
  }, [open, workspaceId])
  return <section id="api-documentation" className="border-accent-light border-b py-10 space-y-4">
    <h2 className="hf-section-title">API Documentation</h2>
    <p>Use a scoped Bearer API key to execute requests. Requests can modify or delete data.</p>
    <button className="border rounded px-4 py-2" type="button" onClick={() => { setError(''); setOpen(!open) }}>{open ? 'Close Swagger UI' : 'Open Swagger UI'}</button>
    {error && <p role="alert">{error}</p>}
    {open && <div ref={container} />}
  </section>
}
