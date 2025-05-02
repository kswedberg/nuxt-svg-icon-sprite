import { fileURLToPath } from 'node:url'
import { createPage, setup } from '@nuxt/test-utils/e2e'
import { describe, test, expect } from 'vitest'

await setup({
  build: true,
  rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
})

describe('The SpriteSymbol component', () => {
  test('is reactive', async () => {
    const page = await createPage('/reactivity')

    const buttons = await page.locator('#buttons button').all()

    expect(buttons).toHaveLength(3)

    let prevMarkup = ''

    for (const button of buttons) {
      const parts = (
        (await button.getAttribute('data-symbol-button')) || ''
      ).split('/')
      const symbolName = parts[1] || parts[0]
      const spriteName = parts[1] ? parts[0] : 'default'

      // Clicking the button should update both <SpriteSymbol> and <SpriteSymbolInline>.
      await button.click()

      // Test the <SpriteSymbol>.
      const href = await page
        .locator(`#sprite-symbol [data-symbol="${symbolName}"] use`)
        .getAttribute('href')
      expect(href).toContain('sprite-' + spriteName)
      expect(href).toContain(symbolName)

      // Test the <SpriteSymbolInline>.
      const svg = page.locator(
        `#sprite-symbol-inline [data-symbol="${symbolName}"]`,
      )
      expect(await svg.isVisible())

      // Get the inlined SVG markup.
      const markup = await svg.innerHTML()

      // It should not equal to the previous markup.
      expect(markup).not.toEqual(prevMarkup)
      prevMarkup = markup
    }
  })
})
