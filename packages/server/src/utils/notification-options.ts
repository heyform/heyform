import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

import { helper } from '@heyform-inc/utils'

export const MAX_RESPONDENT_NAME_LENGTH = 60

type AnswerLike = { kind?: string; value?: any }

/**
 * Reply-To candidate for a submission notification: the first `email` answer
 * holding a valid address. Anything else (including values with line breaks)
 * is skipped, so the result is always safe to use as a mail header.
 */
export function readRespondentEmail(answers?: AnswerLike[]): string | undefined {
  for (const answer of answers ?? []) {
    if (answer.kind !== FieldKindEnum.EMAIL || !helper.isString(answer.value)) {
      continue
    }

    const email = answer.value.trim()

    if (helper.isEmail(email)) {
      return email
    }
  }
}

function cleanName(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  // Control characters (CR/LF included) become spaces, then whitespace is collapsed
  const printable = Array.from(value, char => {
    const code = char.charCodeAt(0)
    return code < 32 || code === 127 ? ' ' : char
  }).join('')

  return printable.replace(/\s+/g, ' ').trim()
}

/**
 * Respondent label for the notification subject: the first non-empty `full_name`
 * answer, else the first non-empty `short_text` answer. Whitespace and control
 * characters are collapsed and the result is capped at `MAX_RESPONDENT_NAME_LENGTH`.
 */
export function readRespondentName(answers?: AnswerLike[]): string | undefined {
  const names = (answers ?? [])
    .filter(answer => answer.kind === FieldKindEnum.FULL_NAME)
    .map(answer => cleanName(`${answer.value?.firstName ?? ''} ${answer.value?.lastName ?? ''}`))
  const texts = (answers ?? [])
    .filter(answer => answer.kind === FieldKindEnum.SHORT_TEXT)
    .map(answer => cleanName(answer.value))
  const name = [...names, ...texts].find(Boolean)

  return name ? Array.from(name).slice(0, MAX_RESPONDENT_NAME_LENGTH).join('').trim() : undefined
}
