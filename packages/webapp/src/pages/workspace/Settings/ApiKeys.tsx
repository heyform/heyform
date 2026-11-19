import { useEffect, useState } from 'react'
import { useParam } from '@/utils'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write', 'members:read', 'workspaces:write', 'projects:write', 'forms:write', 'submissions:read']
type Key = { id: string; name: string; scopes: string[]; revokedAt: string | null }

export default function WorkspaceApiKeys() {
  const { workspaceId } = useParam()
  const [keys, setKeys] = useState<Key[] | null>(null)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const url = '/api/v1/workspaces/' + encodeURIComponent(workspaceId) + '/api/keys'

  useEffect(() => {
    let active = true
    setKeys(null)
    setSecret('')
    setError('')
    setName('')
    setSelected([])
    fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (active && Array.isArray(data)) setKeys(data) })
      .catch(() => {})
    return () => { active = false }
  }, [url])

  async function mutate(method: string, id?: string) {
    setBusy(true)
    setError('')
    setSecret('')
    try {
      const response = await fetch(id ? url + '/' + encodeURIComponent(id) : url, {
        method, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-HeyForm-API-UI': '1' },
        ...(method === 'POST' ? { body: JSON.stringify({ name, scopes: selected }) } : {})
      })
      if (!response.ok) throw new Error('Request failed (' + response.status + ')')
      const result = await response.json()
      if (method === 'POST') {
        setSecret(result.token)
        setName('')
        setSelected([])
        setKeys(previous => [...(previous || []), { id: result.id, name: result.name, scopes: result.scopes, revokedAt: null }])
      } else {
        setKeys(previous => (previous || []).map(key => key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!keys) return null
  return (
    <section id="api-keys" className="border-accent-light border-b py-10 space-y-4">
      <h2 className="hf-section-title">API Keys</h2>
      <p>Manage scoped API keys for this workspace.</p>
      {error && <p role="alert">{error}</p>}
      {secret && <div className="space-y-2"><p>Copy this key now. It will not be shown again.</p><input aria-label="New API key" className="w-full border rounded p-2" readOnly value={secret} /><button type="button" onClick={() => setSecret('')}>Dismiss</button></div>}
      {keys.map(key => <div key={key.id} className="border rounded p-3 space-y-1"><p>{key.name} — {key.revokedAt ? 'Revoked' : 'Active'}</p><p className="text-sm">{key.scopes.join(', ')}</p>{!key.revokedAt && <button type="button" disabled={busy} onClick={() => { if (window.confirm('Revoke this API key?')) void mutate('DELETE', key.id) }}>Revoke</button>}</div>)}
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void mutate('POST') }}>
        <label className="block">Key name<input className="block w-full border rounded p-2" maxLength={100} required value={name} onChange={event => setName(event.target.value)} /></label>
        <fieldset><legend>Permissions</legend>{scopes.map(scope => <label key={scope} className="block"><input type="checkbox" checked={selected.includes(scope)} onChange={event => setSelected(previous => event.target.checked ? [...previous, scope] : previous.filter(item => item !== scope))} /> {scope}</label>)}</fieldset>
        <button className="border rounded px-4 py-2" disabled={busy || !name.trim() || !selected.length}>Create API key</button>
      </form>
    </section>
  )
}
