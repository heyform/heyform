import { IconChevronDown, IconDots, IconKey, IconPlus, IconX } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import type { TOptions } from 'i18next'
import { FormEvent, useId, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { getDeviceId } from '@/utils/auth'

import { Button, Checkbox, Dropdown, Input, Loader, Modal, Select } from '@/components'

type Workspace = { id: string; name: string; scopes: string[] }
type WorkspaceAccess = 'all' | 'selected'
type ApiKey = {
  id: string
  name: string
  scopes: string[]
  workspaceAccess: WorkspaceAccess
  workspaceIds: string[]
  expiresAt: number | null
  revokedAt: string | null
  tokenSuffix: string | null
}
type Access = { keys: ApiKey[]; workspaces: Workspace[]; scopes: string[] }

const url = '/api/v1/account/api-keys'
const expirationOptions = ['1m', '1y', 'custom', 'never'] as const

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  const deviceId = getDeviceId()
  if (deviceId) headers.set('X-Device-Id', deviceId)

  const response = await fetch(url + path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers
  })
  if (!response.ok) throw new Error(String(response.status))
  return response.json()
}

const mutationHeaders = {
  'Content-Type': 'application/json'
}

function useApiAccessTranslation() {
  const { t } = useTranslation()
  return (key: string, options?: TOptions) => String(t(key, { nsSeparator: false, ...options }))
}

function updateSelection(values: string[], value: string, enabled: boolean) {
  return enabled ? [...values, value] : values.filter(item => item !== value)
}

function ApiKeyForm({
  editing,
  workspaces,
  scopes,
  onCancel,
  onSave
}: {
  editing?: ApiKey
  workspaces: Workspace[]
  scopes: string[]
  onCancel: () => void
  onSave: (key: ApiKey, token?: string) => void
}) {
  const t = useApiAccessTranslation()
  const formId = useId()
  const [name, setName] = useState('')
  const [expiration, setExpiration] = useState<(typeof expirationOptions)[number]>('1m')
  const [expiresOn, setExpiresOn] = useState('')
  const [workspaceAccess, setWorkspaceAccess] = useState<WorkspaceAccess>(
    editing?.workspaceAccess ?? 'all'
  )
  const [workspaceIds, setWorkspaceIds] = useState(
    () =>
      editing?.workspaceIds.filter(id => workspaces.some(workspace => workspace.id === id)) ?? []
  )
  const [permissions, setPermissions] = useState(() =>
    editing ? scopes.filter(scope => editing.scopes.includes(scope)) : scopes
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const targetWorkspaces =
    workspaceAccess === 'all'
      ? workspaces
      : workspaces.filter(workspace => workspaceIds.includes(workspace.id))
  const availableScopes = new Set(
    scopes.filter(
      scope =>
        targetWorkspaces.length > 0 &&
        targetWorkspaces.every(workspace => workspace.scopes.includes(scope))
    )
  )
  const selectedPermissions = permissions.filter(scope => availableScopes.has(scope))
  const groups = new Map<string, string[]>()
  for (const scope of scopes) {
    const [group] = scope.split(':')
    groups.set(group, [...(groups.get(group) ?? []), scope])
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(false)
    try {
      const { token, ...key } = await request<ApiKey & { token?: string }>(
        editing ? '/' + editing.id : '',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: mutationHeaders,
          body: JSON.stringify({
            ...(!editing && {
              name: name.trim(),
              expiration,
              ...(expiration === 'custom' && { expiresOn })
            }),
            workspaceAccess,
            workspaceIds: workspaceAccess === 'selected' ? workspaceIds : [],
            scopes: selectedPermissions
          })
        }
      )
      onSave(key, token)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal.Simple
      open
      loading={busy}
      title={t(editing ? 'apiAccess.edit' : 'apiAccess.create')}
      description={editing?.name}
      onOpenChange={open => {
        if (!open) onCancel()
      }}
    >
      <form className="space-y-5" onSubmit={save}>
        {!editing && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={formId + '-name'}>
                {t('apiAccess.name')}
              </label>
              <Input
                id={formId + '-name'}
                value={name}
                onChange={setName}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={formId + '-expiration'}>
                {t('apiAccess.expiration')}
              </label>
              <Select.Native
                id={formId + '-expiration'}
                className="w-full appearance-auto"
                options={expirationOptions.map(value => ({
                  value,
                  label: t('apiAccess.lifetime.' + value)
                }))}
                value={expiration}
                onChange={setExpiration}
              />
            </div>
            {expiration === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor={formId + '-expires-on'}>
                  {t('apiAccess.expiresOn')}
                </label>
                <Input
                  id={formId + '-expires-on'}
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  max="9999-12-31"
                  value={expiresOn}
                  onChange={setExpiresOn}
                  aria-describedby={formId + '-expires-hint'}
                  required
                />
                <p id={formId + '-expires-hint'} className="text-secondary text-xs">
                  {t('apiAccess.expiresOnHint')}
                </p>
              </div>
            )}
          </>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('apiAccess.workspaceAccess')}</legend>
          <div className="border-accent-light space-y-3 rounded-lg border p-4">
            {(['all', 'selected'] as const).map(mode => (
              <div key={mode} className="flex items-start gap-2 text-sm">
                <input
                  id={formId + '-' + mode}
                  aria-describedby={formId + '-' + mode + '-hint'}
                  className="accent-brand mt-1 cursor-pointer"
                  type="radio"
                  name="workspaceAccess"
                  checked={workspaceAccess === mode}
                  onChange={() => setWorkspaceAccess(mode)}
                />
                <div>
                  <label className="cursor-pointer font-medium" htmlFor={formId + '-' + mode}>
                    {t('apiAccess.' + mode)}
                  </label>
                  <div id={formId + '-' + mode + '-hint'} className="text-secondary text-xs">
                    {t('apiAccess.' + mode + 'Hint')}
                  </div>
                </div>
              </div>
            ))}

            {workspaceAccess === 'selected' && (
              <div className="space-y-2 pl-5 text-sm">
                {workspaces.length === 0 ? (
                  <p className="text-secondary">{t('apiAccess.noWorkspaces')}</p>
                ) : (
                  <details>
                    <summary className="border-accent-light hover:bg-accent-light inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5">
                      {t('apiAccess.chooseWorkspaces')}
                      <IconChevronDown aria-hidden className="size-4" />
                    </summary>
                    <ul className="border-accent-light mt-2 max-h-36 space-y-1 overflow-auto rounded-md border p-2">
                      {workspaces.map(workspace => (
                        <li key={workspace.id}>
                          <label className="hover:bg-accent-light flex cursor-pointer items-center gap-2 rounded p-1.5">
                            <Checkbox
                              aria-label={workspace.name}
                              value={workspaceIds.includes(workspace.id)}
                              onChange={selected =>
                                setWorkspaceIds(ids => updateSelection(ids, workspace.id, selected))
                              }
                            />
                            {workspace.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {workspaceIds.length > 0 && (
                  <ul className="divide-accent-light divide-y">
                    {workspaces
                      .filter(workspace => workspaceIds.includes(workspace.id))
                      .map(workspace => (
                        <li key={workspace.id} className="flex items-center justify-between">
                          <span className="truncate">{workspace.name}</span>
                          <Button.Link
                            size="sm"
                            iconOnly
                            aria-label={t('apiAccess.removeWorkspace', { name: workspace.name })}
                            onClick={() =>
                              setWorkspaceIds(updateSelection(workspaceIds, workspace.id, false))
                            }
                          >
                            <IconX aria-hidden className="size-4" />
                          </Button.Link>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('apiAccess.permissions')}</legend>
          {availableScopes.size < scopes.length && (
            <p className="text-secondary text-xs">{t('apiAccess.permissionAvailability')}</p>
          )}
          <div className="border-accent-light divide-accent-light divide-y overflow-hidden rounded-lg border">
            {[...groups].map(([group, groupScopes]) => (
              <details key={group} className="group">
                <summary className="hover:bg-accent-light flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <IconChevronDown aria-hidden className="size-4 -rotate-90 group-open:rotate-0" />
                  {t('apiAccess.groups.' + group, { defaultValue: group })}
                  <span className="text-secondary ml-auto text-xs">
                    {t('apiAccess.permissionCount', {
                      count: groupScopes.filter(scope => selectedPermissions.includes(scope))
                        .length,
                      total: groupScopes.length
                    })}
                  </span>
                </summary>
                {groupScopes.map(scope => {
                  const label = t('apiAccess.scopes.' + scope, { defaultValue: scope })
                  const disabled = !availableScopes.has(scope)
                  return (
                    <label
                      key={scope}
                      className="border-accent-light data-[disabled=true]:text-secondary flex cursor-pointer items-center justify-between border-t py-2 pl-9 pr-3 text-sm data-[disabled=true]:cursor-not-allowed"
                      data-disabled={disabled || undefined}
                    >
                      {label}
                      <Checkbox
                        className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 [&_[data-slot=icon]]:text-white"
                        aria-label={label}
                        value={selectedPermissions.includes(scope)}
                        disabled={disabled}
                        onChange={selected =>
                          setPermissions(values => updateSelection(values, scope, selected))
                        }
                      />
                    </label>
                  )
                })}
              </details>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-error text-sm">
            {t(editing ? 'apiAccess.editError' : 'apiAccess.createError')}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button.Ghost size="md" disabled={busy} onClick={onCancel}>
            {t('components.cancel')}
          </Button.Ghost>
          <Button
            size="md"
            type="submit"
            loading={busy}
            disabled={
              (!editing && (!name.trim() || (expiration === 'custom' && !expiresOn))) ||
              !selectedPermissions.length ||
              (workspaceAccess === 'selected' && !workspaceIds.length)
            }
          >
            {t(editing ? 'components.save' : 'apiAccess.create')}
          </Button>
        </div>
      </form>
    </Modal.Simple>
  )
}

export default function AccountApiAccess() {
  const t = useApiAccessTranslation()
  const { i18n } = useTranslation()
  const { data, loading, error, mutate, refresh } = useRequest(() => request<Access>(''))
  const [form, setForm] = useState<{ key?: ApiKey }>()
  const [secret, setSecret] = useState('')
  const [confirmation, setConfirmation] = useState<{
    key: ApiKey
    action: 'delete' | 'regenerate'
  }>()

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader />
      </div>
    )
  if (error || !data)
    return (
      <div className="space-y-2">
        <p className="text-error text-sm" role="alert">
          {t('apiAccess.loadError')}
        </p>
        <Button.Ghost size="sm" onClick={refresh}>
          {t('apiAccess.retry')}
        </Button.Ghost>
      </div>
    )

  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  })
  const now = Date.now()
  const accessibleWorkspaceIds = new Set(data.workspaces.map(workspace => workspace.id))

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t('apiAccess.keys')}</h3>
          <p className="text-secondary text-sm">
            <Trans
              i18nKey="apiAccess.description"
              components={{
                a: (
                  <a
                    href="https://docs.heyform.net/open-source/rest-api"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary underline underline-offset-4"
                  />
                )
              }}
            />
          </p>
        </div>
        <Button size="md" onClick={() => setForm({})} disabled={!!secret}>
          <IconPlus aria-hidden className="size-4" />
          {t('apiAccess.create')}
        </Button>
      </div>

      {secret && (
        <div className="border-accent-light bg-accent-light/30 space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium" role="status">
            {t('apiAccess.copyHint')}
          </p>
          <Input className="font-mono" aria-label={t('apiAccess.newKey')} readOnly value={secret} />
          <div className="flex gap-2">
            <Button.Copy size="sm" text={secret} />
            <Button.Ghost size="sm" onClick={() => setSecret('')}>
              {t('apiAccess.done')}
            </Button.Ghost>
          </div>
        </div>
      )}

      {data.keys.length === 0 ? (
        <p className="text-secondary border-accent-light rounded-lg border px-4 py-8 text-center text-sm">
          {t('apiAccess.empty')}
        </p>
      ) : (
        <ul className="border-accent-light divide-accent-light divide-y rounded-lg border">
          {data.keys.map(key => {
            const expiresAt = key.expiresAt == null ? null : new Date(key.expiresAt * 1000)
            const expired = expiresAt !== null && expiresAt.getTime() <= now
            const workspaceCount = key.workspaceIds.filter(id =>
              accessibleWorkspaceIds.has(id)
            ).length
            return (
              <li className="flex items-start gap-3 p-3" key={key.id}>
                <IconKey aria-hidden className="text-secondary mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words text-sm font-medium">{key.name}</p>
                  <p className="text-secondary break-all font-mono text-xs">
                    {`ak-heyform-················${key.tokenSuffix ?? ''}`}
                  </p>
                  <p className="text-secondary text-xs">
                    {expiresAt ? (
                      <time dateTime={expiresAt.toISOString()}>
                        {t('apiAccess.expiresAt', { date: dateFormat.format(expiresAt) })}
                      </time>
                    ) : (
                      t('apiAccess.lifetime.never')
                    )}
                  </p>
                </div>
                <div className="text-secondary max-w-[42%] space-y-1 self-center text-right text-xs">
                  <p>
                    {t('apiAccess.accessSummary', {
                      workspaces:
                        key.workspaceAccess === 'all'
                          ? t('apiAccess.all')
                          : t('apiAccess.workspaceCount', { count: workspaceCount }),
                      permissions: t('apiAccess.scopeCount', { count: key.scopes.length })
                    })}
                  </p>
                  {key.revokedAt ? (
                    <p>{t('apiAccess.revoked')}</p>
                  ) : (
                    expired && <p className="text-error">{t('apiAccess.expired')}</p>
                  )}
                </div>
                <Dropdown
                  disabled={!!secret}
                  options={[
                    ...(!key.revokedAt && !expired
                      ? [
                          { value: 'edit', label: t('apiAccess.edit') },
                          { value: 'regenerate', label: t('apiAccess.regenerate') }
                        ]
                      : []),
                    { value: 'delete', label: t('apiAccess.delete') }
                  ]}
                  onClick={action => {
                    if (action === 'edit') setForm({ key })
                    if (action === 'delete' || action === 'regenerate')
                      setConfirmation({ key, action })
                  }}
                >
                  <Button.Link
                    className="shrink-0 self-center"
                    size="sm"
                    iconOnly
                    aria-label={t('apiAccess.actions', { name: key.name })}
                  >
                    <IconDots aria-hidden className="size-4" />
                  </Button.Link>
                </Dropdown>
              </li>
            )
          })}
        </ul>
      )}

      {form && (
        <ApiKeyForm
          editing={form.key}
          workspaces={data.workspaces}
          scopes={data.scopes}
          onCancel={() => setForm(undefined)}
          onSave={(key, token) => {
            const keys = form.key
              ? data.keys.map(item => (item.id === key.id ? key : item))
              : [key, ...data.keys]
            mutate({ ...data, keys })
            if (token) setSecret(token)
            setForm(undefined)
          }}
        />
      )}

      {confirmation && (
        <Modal.Alert
          open
          title={t('apiAccess.' + confirmation.action + 'Title')}
          description={t('apiAccess.' + confirmation.action + 'Hint', {
            name: confirmation.key.name
          })}
          cancelProps={{ label: t('components.cancel') }}
          confirmProps={{ label: t('apiAccess.' + confirmation.action) }}
          onOpenChange={open => {
            if (!open) setConfirmation(undefined)
          }}
          fetch={async () => {
            try {
              const { action, key: target } = confirmation
              if (action === 'delete') {
                await request('/' + target.id, { method: 'DELETE', headers: mutationHeaders })
                mutate({ ...data, keys: data.keys.filter(key => key.id !== target.id) })
              } else {
                const { token, ...key } = await request<ApiKey & { token: string }>(
                  '/' + target.id + '/regenerate',
                  {
                    method: 'POST',
                    headers: mutationHeaders,
                    body: '{}'
                  }
                )
                mutate({ ...data, keys: data.keys.map(item => (item.id === key.id ? key : item)) })
                setSecret(token)
              }
              setConfirmation(undefined)
            } catch {
              throw new Error(t('apiAccess.' + confirmation.action + 'Error'))
            }
          }}
        />
      )}
    </section>
  )
}
