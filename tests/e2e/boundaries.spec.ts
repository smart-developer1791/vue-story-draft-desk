import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
test('maximum accepted content remains usable at 320 px with portable JSON', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  const value = structuredClone(fixture)
  value.name = 'W'.repeat(80)
  value.subtitle = 'S'.repeat(160)
  value.body = 'B'.repeat(10000)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: value.name, level: 1, exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('textbox', { name: 'Story text', exact: true })).toHaveValue(
    'B'.repeat(10000),
  )
  expect(
    await page
      .getByRole('region', { name: 'Saved story preview', exact: true })
      .evaluate((e) => e.scrollHeight > e.clientHeight),
  ).toBe(true)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  const download = await pending,
    encoded = await readFile((await download.path())!, 'utf8')
  expect(JSON.parse(encoded).name).toBe(value.name)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(encoded)
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
