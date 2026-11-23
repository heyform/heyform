import { expect, test } from '@playwright/test'

import { signUpUser } from '../../../server/test/e2e/helpers/fixtures'
import {
  CREATE_FORM_GQL,
  CREATE_TEAM_GQL,
  FORM_DETAIL_GQL,
  TEAMS_GQL,
  UPDATE_FORM_SCHEMAS_GQL
} from '../../../server/test/e2e/helpers/gql'
import { uniqueName } from '../../../server/test/e2e/helpers/random'

test('build and publish a matrix, submit on a narrow screen, and see the answers', async ({
  page,
  browser,
  baseURL
}) => {
  const serverURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9157'
  const { client, email, password } = await signUpUser(serverURL)
  const workspaceId = await client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
    input: { name: uniqueName('Matrix UI'), projectName: 'Survey' }
  })
  const teams = await client.gqlOk<{ id: string; projects: { id: string }[] }[]>('teams', TEAMS_GQL)
  const projectId = teams.find(team => team.id === workspaceId)!.projects[0].id
  const formId = await client.gqlOk<string>('createForm', CREATE_FORM_GQL, {
    input: { projectId, name: 'Matrix survey', interactiveMode: 1, kind: 1 }
  })
  const { version } = await client.gqlOk<{ version: number }>('formDetail', FORM_DETAIL_GQL, {
    input: { formId }
  })
  await client.gqlOk('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
    input: {
      formId,
      version,
      drafts: [{ id: 'ending', kind: 'thank_you', title: ['Matrix complete'] }]
    }
  })

  // The flow uses the local application and its local API only.
  await page.route('**/*', route =>
    route.request().url().startsWith(baseURL!) ? route.continue() : route.abort()
  )
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email address' }).fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)

  const formPath = `/workspace/${workspaceId}/project/${projectId}/form/${formId}`
  await page.goto(`${formPath}/create`)
  await page.getByRole('button', { name: 'Add question' }).click()
  await page.getByRole('button', { name: 'Choice matrix' }).click()
  await page.locator('.heyform-block-title[contenteditable]').fill('Experience')
  await page.getByRole('textbox', { name: 'Row 1' }).fill('Speed')
  await page.getByRole('textbox', { name: 'Row 2' }).fill('Support')
  await page.getByRole('button', { name: 'Add row' }).click()
  await page.getByRole('button', { name: 'Remove Row 3' }).click()
  await page.getByRole('textbox', { name: 'Col 1' }).fill('Rarely')
  await page.getByRole('textbox', { name: 'Col 2' }).fill('Often')
  await page.getByRole('button', { name: 'Remove Col 3' }).click()
  const required = page.getByText('Required', { exact: true }).locator('..').getByRole('switch')
  await required.click()
  await expect(required).toBeChecked()

  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page).toHaveURL(`${formPath}/share`)

  const respondent = await browser.newPage({ baseURL })
  try {
    await respondent.route('**/*', route =>
      route.request().url().startsWith(baseURL!) ? route.continue() : route.abort()
    )
    await respondent.goto(`/form/${formId}`)
    await expect(respondent.locator('.heyform-matrix-header')).toBeVisible()

    await respondent.setViewportSize({ width: 390, height: 844 })
    await expect(respondent.locator('.heyform-matrix-header')).toBeHidden()
    const speed = respondent.getByRole('radiogroup', { name: 'Speed' })
    const support = respondent.getByRole('radiogroup', { name: 'Support' })
    await expect(speed.getByText('Often', { exact: true })).toBeVisible()
    await speed.getByRole('radio', { name: 'Rarely' }).check()
    await respondent.getByRole('button', { name: 'Submit' }).click()
    await expect(respondent.getByText('This field is required')).toBeVisible()

    await speed.getByRole('radio', { name: 'Often' }).check()
    await expect(speed.getByRole('radio', { name: 'Rarely' })).not.toBeChecked()
    await support.getByRole('radio', { name: 'Rarely' }).check()
    await respondent.getByRole('button', { name: 'Submit' }).click()
    await expect(respondent.getByText('Matrix complete')).toBeVisible()
  } finally {
    await respondent.close()
  }

  await page.goto(`${formPath}/submissions`)
  await expect(page.getByText('Speed: Often, Support: Rarely')).toBeVisible()
})
