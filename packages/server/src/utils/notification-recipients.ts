import { BadRequestException } from '@nestjs/common'

import { helper } from '@heyform-inc/utils'

export const MAX_NOTIFICATION_RECIPIENTS = 10

function cleanRecipients(recipients: unknown[]): { emails: string[]; invalid: unknown[] } {
  const emails = new Set<string>()
  const invalid: unknown[] = []

  for (const recipient of recipients) {
    const email = typeof recipient === 'string' ? recipient.trim().toLowerCase() : ''

    if (helper.isEmail(email)) {
      emails.add(email)
    } else {
      invalid.push(recipient)
    }
  }

  return { emails: Array.from(emails), invalid }
}

/**
 * Validates the `notificationRecipients` form setting submitted by a client:
 * every entry must be a valid email address; entries are trimmed, lowercased
 * and de-duplicated; at most `MAX_NOTIFICATION_RECIPIENTS` remain.
 * `null`/`undefined` clears the list.
 */
export function normalizeNotificationRecipients(recipients: unknown): string[] {
  if (recipients === null || recipients === undefined) {
    return []
  }

  if (!Array.isArray(recipients)) {
    throw new BadRequestException('The notification recipients must be a list of email addresses')
  }

  const { emails, invalid } = cleanRecipients(recipients)

  if (invalid.length > 0) {
    throw new BadRequestException(
      `Invalid notification recipient email address: ${invalid.map(String).join(', ')}`
    )
  }

  if (emails.length > MAX_NOTIFICATION_RECIPIENTS) {
    throw new BadRequestException(
      `A form can have at most ${MAX_NOTIFICATION_RECIPIENTS} notification recipients`
    )
  }

  return emails
}

/**
 * Lenient variant used when sending: whatever is stored is cleaned up and
 * anything unusable is skipped instead of failing the notification.
 */
export function readNotificationRecipients(recipients: unknown): string[] {
  if (!Array.isArray(recipients)) {
    return []
  }

  return cleanRecipients(recipients).emails.slice(0, MAX_NOTIFICATION_RECIPIENTS)
}
