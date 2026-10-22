# Integration apps

Each integration is one file in this folder that default-exports an app built with `defineApp()`
from `./types`. The definition drives both sides:

- the webapp renders the app's settings form from `settings`, with no app-specific UI;
- the server validates saved settings against `settings`, then calls the app's `validate` hook;
- the integration queue calls `run` for every new submission while the integration is active.

## Adding an app

1. Create `src/apps/<id>.ts` and default-export `defineApp({ ... })`.
2. Re-export it from `src/apps/index.ts` under its id: `export { default as <id> } from './<id>'`.
3. Add its logo to `packages/webapp/public/static/` and set `icon` to `/static/<file>`.
4. Optionally translate it in the webapp locales under `form.integrations.apps.<id>` (see below).

The webhook (`webhook.ts`) is the smallest complete example:

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

| Field         | Description                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`          | Unique id, stored on each integration. Never change it once released.                                          |
| `name`        | Display name.                                                                                                  |
| `description` | One sentence shown in the integrations list and settings modal.                                                |
| `icon`        | Path of the logo served by the server, e.g. `/static/webhook.png`.                                             |
| `auth`        | How HeyForm authenticates with the app. Defaults to `{ type: 'none' }`, the only type supported so far.        |
| `settings`    | Fields the form owner fills in. See below.                                                                     |
| `validate`    | Optional. Receives the config after the generic checks; throw a `BadRequestException` to reject it.            |
| `run`         | Receives `{ config, submission, form }` for each submission. Throwing fails the queue job, which Bull retries. |

## Settings

Every setting has `type`, `name` (its key in the config), `label`, and optionally `description`,
`placeholder`, `required` and `defaultValue`.

| `type`     | Renders as      | Stored value | Extra props                              |
| ---------- | --------------- | ------------ | ---------------------------------------- |
| `text`     | Input           | string       |                                          |
| `url`      | Input           | string       | Must be an `http://` or `https://` URL.  |
| `textarea` | Multi-line text | string       |                                          |
| `select`   | Select          | string       | `options: { label, value }[]`, required. |
| `switch`   | Switch          | boolean      | Missing values are stored as `false`.    |

When settings are saved, the server:

1. rejects a missing or blank `required` value, after applying `defaultValue`;
2. checks each value's type, URL format and that a select value is one of its `options`;
3. drops any key that isn't a declared setting;
4. calls the app's `validate` with the cleaned config, then stores that config.

## Translations

The webapp looks labels up under `form.integrations.apps.<id>` and falls back to the English in the
definition, so translations are optional:

```json
{
  "description": "...",
  "settings": {
    "<name>": {
      "label": "...",
      "description": "...",
      "options": { "<value>": "..." }
    }
  }
}
```

Keep option values to letters, digits, `-` and `_`, since they become part of the translation key.
