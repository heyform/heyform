// @vitest-environment jsdom
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import i18n from '../src/i18n'
import SubmissionCell, { SubmissionHeaderCell } from '../src/pages/form/Submissions/SubmissionCell'

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const field = {
  id: FieldKindEnum.IP_ADDRESS,
  kind: FieldKindEnum.IP_ADDRESS,
  title: i18n.t('form.builder.question.ipAddress')
}

test('the IP address column has a header with an icon, and shows the address', async () => {
  await act(async () => root.render(<SubmissionHeaderCell field={field as any} />))

  expect(container.textContent).toBe('IP address')
  expect(container.querySelector('svg')).not.toBeNull()

  await act(async () =>
    root.render(
      <SubmissionCell
        field={field as any}
        submission={{ id: 's1' } as any}
        answer={{ id: field.id, kind: field.kind, value: '203.0.113.10' } as any}
        isTableCell
      />
    )
  )

  expect(container.textContent).toBe('203.0.113.10')
})
