import { describe, it, expect } from 'vitest'
import { testProcessor } from './base'
import { removeSizes } from '~/src/processors/removeSizes'

describe('removeSizes', () => {
  const processor = removeSizes()

  it('should remove width and height attributes', async () => {
    expect(await testProcessor('<svg width="10" height="50"></svg>', processor))
      .toMatchInlineSnapshot(`
        "<svg></svg>
        "
      `)
  })

  it('should remove width and height attributes with different units', async () => {
    expect(
      await testProcessor('<svg width="10%" height="50px"></svg>', processor),
    ).toMatchInlineSnapshot(`
      "<svg></svg>
      "
    `)
  })

  it('should handle SVG with only width attribute', async () => {
    expect(await testProcessor('<svg width="100"></svg>', processor))
      .toMatchInlineSnapshot(`
        "<svg></svg>
        "
      `)
  })

  it('should handle SVG with only height attribute', async () => {
    expect(await testProcessor('<svg height="200"></svg>', processor))
      .toMatchInlineSnapshot(`
      "<svg></svg>
      "
    `)
  })

  it('should handle SVG without width and height attributes', async () => {
    expect(await testProcessor('<svg viewBox="0 0 100 100"></svg>', processor))
      .toMatchInlineSnapshot(`
        "<svg viewBox="0 0 100 100"></svg>
        "
      `)
  })

  it('should preserve other attributes', async () => {
    expect(
      await testProcessor(
        '<svg width="10" height="50" viewBox="0 0 100 100" fill="none"></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(`
      "<svg viewBox="0 0 100 100" fill="none"></svg>
      "
    `)
  })

  it('should not handle nested elements', async () => {
    expect(
      await testProcessor(
        '<svg width="100" height="100"><rect width="50" height="50" /></svg>',
        processor,
      ),
    ).toMatchInlineSnapshot(
      `
      "<svg><rect width="50" height="50"></rect></svg>
      "
    `,
    )
  })

  it('should handle width and height with no value', async () => {
    expect(await testProcessor('<svg width height></svg>', processor))
      .toMatchInlineSnapshot(`
        "<svg></svg>
        "
      `)
  })

  it('should handle width and height with empty string value', async () => {
    expect(await testProcessor('<svg width="" height=""></svg>', processor))
      .toMatchInlineSnapshot(`
        "<svg></svg>
        "
      `)
  })
})
