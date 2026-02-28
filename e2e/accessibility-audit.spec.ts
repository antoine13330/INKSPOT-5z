import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'Login', path: '/auth/login' },
  { name: 'Register', path: '/auth/register' },
  { name: 'Reset Password', path: '/auth/reset-password' },
]

for (const { name, path } of pages) {
  test(`${name} (${path}) should have no critical a11y violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      ).join('\n')
      console.log(`A11y issues on ${name}:\n${summary}`)
    }

    expect(
      critical.filter((v) => v.impact === 'critical'),
      `Critical a11y violations found on ${name}`
    ).toHaveLength(0)
  })
}
