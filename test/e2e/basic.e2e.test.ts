import { fileURLToPath } from 'node:url'
import { createPage, setup } from '@nuxt/test-utils/e2e'
import { describe, test, expect } from 'vitest'

await setup({
  build: true,
  rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
})

describe('The SpriteSymbol component', () => {
  test('is rendered correctly', async () => {
    const page = await createPage('/')

    const icon1 = await page.locator('#symbol-inline-account').innerHTML()
    expect(icon1).toMatchInlineSnapshot(`
      "<svg data-symbol="account" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-attribute-from-symbol-processor="is-svg" aria-hidden="true">
        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" data-attribute-from-symbol-processor="path"></path>
      </svg>"
    `)
  })

  test('contains attributes added by processors', async () => {
    const page = await createPage('/')

    const icon1 = page.locator('#symbol-inline-account > svg')
    expect(
      await icon1.getAttribute('data-attribute-from-symbol-processor'),
    ).toEqual('is-svg')

    expect(
      await icon1
        .locator('path')
        .getAttribute('data-attribute-from-symbol-processor'),
    ).toEqual('path')
  })
})
