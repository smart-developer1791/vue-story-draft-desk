import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
test('committed snapshots update preview and saves while Undo/Redo and branching publish new values', async ({
  page,
}) => {
  await page.goto('/')
  const body = page.getByRole('textbox', { name: 'Story text', exact: true }),
    reader = page.getByRole('region', { name: 'Saved story preview', exact: true })
  await body.fill('A first kept version.')
  await page.getByRole('textbox', { name: 'Snapshot label', exact: true }).fill('Opening')
  await expect(reader).not.toContainText('A first kept version.')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await expect(reader).toContainText('A first kept version.')
  await expect(page.locator('[data-snapshot]')).toHaveCount(2)
  await body.fill('A second kept version.')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(body).toHaveValue('A first kept version.')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(body).toHaveValue('A second kept version.')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await body.fill('A different branch.')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled()
  await expect(page.locator('[data-snapshot]')).toHaveCount(3)
  await page.reload()
  await expect(body).toHaveValue('A different branch.')
  await expect(page.locator('[data-snapshot]')).toHaveCount(1)
})
test('pending text is protected during history navigation and invalid commits keep the last save', async ({
  page,
}) => {
  await page.goto('/')
  const body = page.getByRole('textbox', { name: 'Story text', exact: true })
  await body.fill('A kept version.')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await body.fill('Unsaved text to protect.')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'Discard pending edits?', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(body).toHaveValue('Unsaved text to protect.')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await page.getByRole('button', { name: 'Load snapshot', exact: true }).click()
  await expect(body).not.toHaveValue('Unsaved text to protect.')
  const before = await page.evaluate(() => localStorage.getItem('vue-story-draft-desk:v1'))
  await page.getByRole('textbox', { name: 'Story title', exact: true }).fill('')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await expect(page.locator('[data-ui="story-editor"]').getByRole('alert')).toContainText(
    'Story title',
  )
  expect(await page.evaluate(() => localStorage.getItem('vue-story-draft-desk:v1'))).toBe(before)
})
test('bounded UI history skips duplicate saves and keeps the reader frame stable', async ({
  page,
}) => {
  await page.goto('/')
  const reader = page.locator('[data-ui="story-reader"]'),
    before = (await reader.boundingBox())!.height
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await expect(page.locator('[data-snapshot]')).toHaveCount(1)
  await expect(page.getByText('No text changes to save.', { exact: true })).toBeVisible()
  for (let i = 0; i < 31; i++) {
    await page.getByRole('textbox', { name: 'Story text', exact: true }).fill(`A kept draft ${i}.`)
    await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  }
  await expect(page.locator('[data-snapshot]')).toHaveCount(30)
  await page.locator('[data-snapshot="0"]').click()
  await expect(page.getByRole('textbox', { name: 'Story text', exact: true })).toHaveValue(
    'A kept draft 1.',
  )
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
  expect((await reader.boundingBox())!.height).toBe(before)
})
test('plain text download follows the committed snapshot and leaves markup literal', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('textbox', { name: 'Story text', exact: true })
    .fill('<script>plain prose</script>\n\nA second paragraph.')
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Story text', exact: true })
    .fill('A pending replacement.')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  const download = await pending,
    txt = await readFile((await download.path())!, 'utf8')
  expect(download.suggestedFilename()).toMatch(/^SD-[A-F0-9]{8}\.txt$/)
  expect(txt).toContain('<script>plain prose</script>')
  expect(txt).not.toContain('A pending replacement.')
  expect(txt).toContain('CodeSculptor')
})
