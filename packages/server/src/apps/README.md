# Integration apps

Each integration is one file in this folder that default-exports an app built with `defineApp()`
from `./types`. The definition drives both sides:

- the webapp renders the app's settings form from `settings`, with no app-specific UI;
- the server validates saved settings against `settings`, then calls the app's `validate` hook;
- the integration queue calls `run` for every new submission while the integration is active,
  with credentials for the app's `auth`.

## Adding an app

1. Create `src/apps/<id>.ts` and default-export `defineApp({ ... })`.
2. Re-export it from `src/apps/index.ts` under its id: `export { default as <id> } from './<id>'`.
3. Add its logo to `packages/webapp/public/static/` and set `icon` to `/static/<file>`.
4. Optionally translate it in the webapp locales under `form.integrations.apps.<id>` (see below).

The webhook (`webhook.ts`) is the smallest complete example. Google Sheets (`googlesheets.ts`)
shows OAuth2, options loaded from the service, a setting shown only for one choice, and a
`validate` that uses the account and normalises what was entered.

```ts
import { assertSafeOutboundRequest, assertSafeOutboundUrl } from '@utils'

import { defineApp } from './types'

export default defineApp({
  id: 'webhook',
  name: 'Webhook',
  description:
    "With webhooks integration, you can send every submission straight to any URL as soon as it's submitted.",
  icon: '/static/webhook.png',
  settings: [
    {
      type: 'url',
      name: 'endpointUrl',
      label: 'Endpoint URL',
      placeholder: 'https://webhook.example.com',
      required: true
    }
  ],
  validate: async config => {
    await assertSafeOutboundUrl(config.endpointUrl)
  },
  run: async ({ config, submission, form }) => {
    // POST the submission to config.endpointUrl
  }
})
```

## Definition

| Field         | Description                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `id`          | Unique id, stored on each integration. Never change it once released.                                |
| `name`        | Display name.                                                                                        |
| `description` | One sentence shown in the integrations list and settings modal.                                      |
| `icon`        | Path of the logo served by the server, e.g. `/static/webhook.png`.                                   |
| `auth`        | How HeyForm authenticates with the app's service: `none` (default), `apiKey` or `oauth2`. See below. |
| `settings`    | Fields the form owner fills in. See below.                                                           |
| `queue`       | Optional retry and timeout options for the app's delivery jobs. See below.                           |
| `validate`    | Optional. Receives the config after the generic checks. See [Validating](#validating).               |
| `run`         | Receives `{ config, submission, form, auth }` for each submission. See [Errors](#errors).            |

## Settings

Every setting has `type`, `name` (its key in the config), `label`, and optionally `description`,
`placeholder`, `required`, `defaultValue` and `visibleWhen`.

| `type`     | Renders as      | Stored value | Extra props                                                  |
| ---------- | --------------- | ------------ | ------------------------------------------------------------ |
| `text`     | Input           | string       |                                                              |
| `url`      | Input           | string       | Must be an `http://` or `https://` URL.                      |
| `textarea` | Multi-line text | string       |                                                              |
| `select`   | Select          | string       | `options: { label, value }[]`, or `loadOptions` (see below). |
| `switch`   | Switch          | boolean      | Missing values are stored as `false`.                        |

`visibleWhen: { <name>: <value> }` shows a setting only while each named setting, declared before
it, has that value. A hidden setting isn't required and isn't stored:

```ts
{ type: 'switch', name: 'createSpreadsheet', label: 'Create a new spreadsheet' },
{ type: 'text', name: 'spreadsheet', label: 'Spreadsheet URL', required: true,
  visibleWhen: { createSpreadsheet: false } }
```

### Loaded options

A `select` can load its options from the app's service instead, e.g. the tabs of a spreadsheet:

```ts
{
  type: 'select',
  name: 'sheet',
  label: 'Tab',
  dependsOn: ['spreadsheet'],
  loadOptions: async ({ config, auth }) => {
    const tabs = await listTabs(auth.accessToken, config.spreadsheet)
    return tabs.map(tab => ({ label: tab.title, value: String(tab.id) }))
  }
}
```

The webapp calls `loadOptions` through the `integrationSettingOptions` query when the settings
open, and again when the account or a setting named in `dependsOn` changes (not while one of them
is blank). It receives the values in the form as `config`, not yet validated, and `auth` for the
key or account being picked, with a fresh access token as in `run`. An `AppError` it throws shows
under the select. HeyForm keeps the first 500 options, drops those without a value (or one over
500 characters) and shortens labels to 200 characters.

The server can't check a saved value against options it loads, only that it's text, so check it
in `validate`.

### Validating

When settings are saved, the server:

1. skips settings hidden by `visibleWhen`;
2. rejects a missing or blank `required` value, after applying `defaultValue`;
3. checks each value's type, URL format and that a select value is one of its fixed `options`;
4. drops any key that isn't a declared, visible setting;
5. calls the app's `validate(config, { form, auth })` with the cleaned config, then stores that
   config, or the config `validate` returns, and sends the stored config back to the settings form.

`auth` is the key or account being saved, as `run` would get it, so `validate` can check the
config against the service and normalise it, e.g. reduce a pasted URL to an id, or create the
resource and store its id. Throw an `AppError` (or a `BadRequestException`) to reject the config;
its message shows in the settings form. If the account needs reconnecting, saving fails before
`validate` runs.

## Auth

HeyForm stores the credentials, encrypted with `INTEGRATION_ENCRYPTION_KEY` (see
[Encryption key](#encryption-key)), and passes `run` a ready-to-use `auth` value. Credentials are
never sent to the browser, and app code never stores, decrypts or refreshes them.

| `auth`                                     | The form owner                                                       | `run` receives                    |
| ------------------------------------------ | -------------------------------------------------------------------- | --------------------------------- |
| `{ type: 'none' }`                         | does nothing extra.                                                  | `{ type: 'none' }`                |
| `{ type: 'apiKey', label?, description? }` | pastes a key above the settings. At most its last 4 characters show. | `{ type: 'apiKey', apiKey }`      |
| `{ type: 'oauth2', provider, scopes }`     | picks one of the workspace's connected accounts, or connects one.    | `{ type: 'oauth2', accessToken }` |

`defineApp` types `auth` in `run` from the definition, so an `oauth2` app can use
`auth.accessToken` directly:

```ts
export default defineApp({
  id: 'example',
  // ...
  auth: {
    type: 'oauth2',
    provider: 'example',
    scopes: ['rows.write']
  },
  run: async ({ auth, config, submission }) => {
    await got.post('https://api.example.com/rows', {
      headers: { authorization: `Bearer ${auth.accessToken}` },
      json: { submissionId: submission.id, sheet: config.sheet }
    })
  }
})
```

### OAuth2

`provider` is the id of a provider in `oauth2-providers.ts` (only `google` so far); an app naming
a provider that isn't there is hidden, like one whose provider has no credentials. To add one, give
its authorize, token and OpenID Connect userinfo URLs, the scopes that let the userinfo endpoint
identify the account (`identityScopes`, e.g. `openid email`), and its revoke URL (RFC 7009) if it
has one, then add it to `oauth2Providers`:

```ts
export const example: OAuth2Provider = {
  id: 'example',
  name: 'Example', // the button reads "Connect Example account"
  authorizeUrl: 'https://auth.example.com/oauth2/authorize',
  tokenUrl: 'https://auth.example.com/oauth2/token',
  userInfoUrl: 'https://auth.example.com/oauth2/userinfo',
  identityScopes: ['openid', 'email'],
  revokeUrl: 'https://auth.example.com/oauth2/revoke',
  pkce: true
}

export const oauth2Providers: Record<string, OAuth2Provider> = {
  example
}
```

**Who configures what.** The OAuth client belongs to the installation, not to each form owner,
like `GOOGLE_LOGIN_CLIENT_ID` for login with Google. Whoever runs the server registers one OAuth
client per provider, once:

- set `<PROVIDER>_INTEGRATION_CLIENT_ID` and `<PROVIDER>_INTEGRATION_CLIENT_SECRET`, e.g.
  `EXAMPLE_INTEGRATION_CLIENT_ID` for the provider `example`;
- register `${APP_HOMEPAGE_URL}/api/integrations/oauth/callback` as the redirect URI.

Form owners then only click **Connect <provider> account** and sign in. Until both variables are
set, apps using that provider are hidden.

**Google.** In the [Google Cloud console](https://console.cloud.google.com/), in one project:

1. enable the **Google Sheets API** (APIs & Services → Library);
2. configure the **OAuth consent screen** and set its publishing status to **In production**. It
   can stay unverified for your own users, who'll see an "unverified app" warning when they
   connect. Or make it **Internal** if everyone is in your Google Workspace. In **Testing**, Google
   expires refresh tokens after 7 days, so every connection would need reconnecting weekly;
3. create an **OAuth client ID** of type **Web application**, with
   `${APP_HOMEPAGE_URL}/api/integrations/oauth/callback` as an authorised redirect URI;
4. set `GOOGLE_INTEGRATION_CLIENT_ID` and `GOOGLE_INTEGRATION_CLIENT_SECRET` to its client ID and
   secret, and restart the server.

**Connections belong to the workspace.** Connecting an account stores it once for the form's
workspace (team), identified by the provider's account id (`sub`), with its email shown to the team.
Connecting the same account again, from any form and by any member, updates that connection rather
than adding another. An integration uses one of the workspace's connections, picked in its settings;
any member can pick any connection, and the picker shows whose account it is. A connection lists the
scopes it has granted, and an app can only use one that has granted its scopes.

The workspace's settings list its connected accounts, the forms using each, and their status. The
member who connected an account, or the workspace owner, can disconnect it. Disconnecting revokes
the grant at the provider's revoke URL, best effort (a failure is logged without the token and never
stops the disconnect), deletes the tokens, and leaves the integrations that used it needing
reconnection until someone picks another account. Some providers (Google, for one) revoke the
whole grant, i.e. every token this server holds for that account, so the grant isn't revoked while
another workspace on the server still has the same account connected. Deleting an integration doesn't touch the connection.

When a job runs, HeyForm refreshes the connection's access token if it has expired (there's no
scheduled refresh), and so does loading options or saving settings with the account. One refresh runs at a time per connection (a Redis lock), and the others use
its token, so integrations sharing a connection don't race. If the provider rejects the refresh
token (`invalid_grant`, e.g. access was revoked), the connection and every active integration using
it are marked as needing reconnection and the job stops retrying. Network errors and provider
outages are retried like any other failure.

While an integration needs reconnecting, its submissions wait (see [Delivery log](#delivery-log)).
Reconnecting the account sends the waiting submissions of every integration that uses it. A saved
API key that can no longer be decrypted (see [Encryption key](#encryption-key)) is treated the same
way: entering the key again reconnects it.

### Encryption key

API keys and OAuth2 tokens are encrypted with `INTEGRATION_ENCRYPTION_KEY` (AES-256-GCM, a key
derived with HKDF, a random IV per value). It's separate from `FORM_ENCRYPTION_KEY`, which protects
short-lived form tokens, so rotating either never breaks the other. Without it, apps whose `auth` is
`apiKey` or `oauth2` are unavailable and hidden, and the server logs one warning at startup; `none`
apps such as the webhook keep working.

Each stored value starts with the id of the key that encrypted it (`<keyId>:…`, a fingerprint of
the derived key). To rotate the key, set `INTEGRATION_ENCRYPTION_KEY_PREVIOUS` to the old value and
`INTEGRATION_ENCRYPTION_KEY` to the new one, and restart. The previous key is only used to read.
Every write uses the current key, so tokens move to it as they refresh. Then run
`node dist/src/cli/reencrypt-integration-secrets.js` (or `pnpm integrations:reencrypt` from a source
checkout) to re-encrypt everything still on the old key, and remove the previous key. The command
only updates values that haven't changed since it read them, so it's safe to run while the server
runs, and again.

A value that neither key decrypts marks its connection, or its API-key integration, as needing
reconnection, with the reason, and its submissions wait until someone connects the account or
enters the key again.

## Queue

Each submission becomes one job on the integration queue, which retries failures with the global
`BULL_JOB_ATTEMPTS`, `BULL_JOB_BACKOFF_*` and `BULL_JOB_TIMEOUT` settings. An app can override them:

```ts
queue: {
  attempts: 5, // total tries, including the first
  backoff: { type: 'exponential', delay: 2000 }, // or a fixed delay in ms
  timeout: 30_000 // ms per try
}
```

Credential errors that a retry can't fix (no API key saved, a revoked OAuth grant) fail the job
without further attempts, as does an `AppError` that isn't retryable (see [Errors](#errors)).

## Errors

Throw an `AppError` from `run`, `validate` or `loadOptions` to say what went wrong and whether
another try can help:

```ts
import { AppError } from './types'

throw new AppError('The spreadsheet was not found', { retryable: false })

// 401 → unauthorized; 408, 429 and 5xx → retryable; other 4xx → not retryable
throw AppError.fromStatus(response.statusCode, `Example rejected the request`)
```

| Option         | Default | Effect                                                                                                                                                                                                                                                               |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `retryable`    | `true`  | `false` fails the delivery without further attempts, e.g. for a deleted resource.                                                                                                                                                                                    |
| `unauthorized` | `false` | The service rejected the access token before it expired, e.g. access was revoked. HeyForm refreshes the token and calls the app once more. If the provider refuses the refresh, the connection needs reconnecting and the submission waits, as for an expired token. |

Any other error fails the attempt, and Bull retries it.

## Delivery log

Every attempt is recorded in `IntegrationRecordModel`: whether it succeeded, the attempt number,
whether the queue will retry, and the error message of a failure (shortened to 500 characters).
The form owner sees the 20 most recent records in the integration's settings. Records are kept for
30 days and deleted with the integration.

A submission that can't be sent because the integration needs reconnecting gets a waiting record
instead: either it arrived while the integration needed reconnecting, or its job found the grant
revoked. Waiting records don't expire. When the integration becomes active again (the account is
reconnected, a new API key is saved, or the integration is turned back on), each waiting submission
is queued again, oldest first, and its record is removed. Each record is claimed once and jobs use
`<integrationId>-<submissionId>` as their Bull job id, so a reconnect handled twice doesn't send a
submission twice. An integration holds at most 1,000 waiting submissions (`MAX_WAITING_RECORDS`);
later ones are recorded as failed. Deleting the integration discards them.

The error message of whatever `run` throws is shown to the form owner, so keep secrets and
submission data out of it.

## Translations

The webapp looks labels up under `form.integrations.apps.<id>` and falls back to the English in the
definition, so translations are optional:

```json
{
  "description": "...",
  "auth": { "label": "...", "description": "..." },
  "settings": {
    "<name>": {
      "label": "...",
      "description": "...",
      "placeholder": "...",
      "options": { "<value>": "..." }
    }
  }
}
```

Keep option values to letters, digits, `-` and `_`, since they become part of the translation key.
Loaded options are shown as the app returns them.
