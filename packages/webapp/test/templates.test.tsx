// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { FormService } from '../src/services'

import i18n from '../src/i18n'
import TemplatesModel from '../src/layouts/Workspace/TemplatesModel'
import type { TemplateType } from '../src/types'

vi.mock('@heyform-inc/form-renderer', async importOriginal => ({
  ...(await importOriginal<typeof import('@heyform-inc/form-renderer')>()),
  FormRenderer: ({ form }: { form: { fields: { title: string }[] } }) => (
    <div data-testid="template-preview">{form.fields.map(field => field.title).join(', ')}</div>
  )
}))

let container: HTMLDivElement
let root: Root
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})
async function render() {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/workspace/w/project/p/']}>
        <Routes>
          <Route
            path="/workspace/:workspaceId/project/:projectId/"
            element={<TemplatesModel onBack={() => {}} />}
          />
        </Routes>
      </MemoryRouter>
    )
  )
}
test('an empty library offers JSON import without empty category sections', async () => {
  vi.spyOn(FormService, 'templates').mockResolvedValue([])
  await render()
  expect(container.textContent).toContain('No templates available')
  expect(container.querySelectorAll('ul')).toHaveLength(0)
  expect(container.querySelector('input[type=file]')).not.toBeNull()
})
test('available templates appear as accessible cards under their populated category', async () => {
  vi.spyOn(FormService, 'templates').mockResolvedValue([
    { id: 'survey', name: 'Market Research Survey', category: 'Survey' } as TemplateType
  ])
  await render()
  expect(container.querySelector('h3')?.textContent).toBe('Survey')
  expect(container.querySelector('li button')?.textContent).toContain('Market Research Survey')
  expect(container.textContent).not.toContain('Lead Generation')
  expect(container.textContent).not.toContain('No templates available')
})

test('selecting a summary fetches full content and creates a form using the same template ID', async () => {
  vi.spyOn(FormService, 'templates').mockResolvedValue([
    { id: 'survey', name: 'Product Survey Form', category: 'Survey' } as TemplateType
  ])
  vi.spyOn(FormService, 'templateDetail').mockResolvedValue({
    id: 'survey',
    fields: [{ id: 'name', kind: 'short_text', title: 'Full Name' }]
  })
  vi.spyOn(FormService, 'useTemplate').mockResolvedValue('new-form')
  await render()
  await act(async () => container.querySelector<HTMLButtonElement>('li button')!.click())
  expect(FormService.templateDetail).toHaveBeenCalledWith('survey')
  expect(container.querySelector('[data-testid="template-preview"]')?.textContent).toBe('Full Name')
  const useButton = Array.from(container.querySelectorAll('button')).find(
    button => button.textContent === i18n.t('form.template.use')
  )!
  await act(async () => useButton.click())
  expect(FormService.useTemplate).toHaveBeenCalledWith({ projectId: 'p', templateId: 'survey' })
})
