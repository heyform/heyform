import { helper } from '@heyform-inc/utils'

// Keep in sync with MAX_NOTIFICATION_RECIPIENTS in packages/server/src/utils/notification-recipients.ts
export const MAX_NOTIFICATION_RECIPIENTS = 10

const SEPARATOR = /[\s,;]/

/**
 * Splits on whitespace, commas and semicolons, except inside a quoted local
 * part (`"john doe"@example.com`), where separators and backslash-escaped
 * quotes belong to the address.
 */
function splitRecipients(value: string): string[] {
  const items: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]

    if (quoted && char === '\\' && i + 1 < value.length) {
      current += char + value[++i]
    } else if (char === '"') {
      quoted = !quoted
      current += char
    } else if (!quoted && SEPARATOR.test(char)) {
      items.push(current)
      current = ''
    } else {
      current += char
    }
  }

  items.push(current)

  return items
}

/**
 * Splits free text (one address per line, or separated by commas, semicolons
 * or spaces) into trimmed, lowercased, de-duplicated entries.
 */
export function parseNotificationRecipients(value?: string): string[] {
  return Array.from(
    new Set(
      splitRecipients(value ?? '')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean)
    )
  )
}

/**
 * Mirrors the server-side validation. Returns the translation key and values
 * of the first problem, or `undefined` when the list is acceptable.
 */
export function validateNotificationRecipients(
  recipients: string[]
): { key: string; values?: Record<string, unknown> } | undefined {
  const invalid = recipients.find(email => !helper.isEmail(email))

  if (invalid) {
    return { key: 'form.settings.emailNotification.recipients.invalid', values: { email: invalid } }
  }

  if (recipients.length > MAX_NOTIFICATION_RECIPIENTS) {
    return {
      key: 'form.settings.emailNotification.recipients.tooMany',
      values: { max: MAX_NOTIFICATION_RECIPIENTS }
    }
  }
}
