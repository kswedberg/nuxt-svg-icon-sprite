import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SpriteSymbolInline from '~/src/runtime/components/SpriteSymbolInline'

// Mock the runtime options
const runtimeMock = vi.hoisted(() => ({
  runtimeOptions: {
    ariaHidden: false,
  },
}))

vi.mock('#nuxt-svg-icon-sprite/runtime', () => runtimeMock)

// Mock symbolImports.
const symbolImports = vi.hoisted(() => ({
  'valid-symbol': {
    attributes: {
      viewBox: '0 0 24 24',
      width: '24',
      height: '24',
    },
    content: '<path d="M12 2L2 7l10 5 10-5-10-5z"></path>',
  },
  'special/icon': {
    attributes: {
      viewBox: '0 0 16 16',
      width: '16',
      height: '16',
    },
    content: '<circle cx="8" cy="8" r="7"></circle>',
  },
  // Add async symbol import
  'async-symbol': () =>
    Promise.resolve({
      attributes: {
        viewBox: '0 0 32 32',
        width: '32',
        height: '32',
      },
      content: '<rect x="4" y="4" width="24" height="24"></rect>',
    }),
}))

vi.mock('#nuxt-svg-icon-sprite/symbol-import', () => ({
  symbolImports,
}))

describe('SymbolInline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeMock.runtimeOptions.ariaHidden = false
  })

  it('renders a valid symbol correctly', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'valid-symbol',
      },
    })

    expect(component.html()).toContain('data-symbol="valid-symbol"')
    expect(component.html()).toContain('viewBox="0 0 24 24"')
    expect(component.html()).toContain('width="24"')
    expect(component.html()).toContain('height="24"')
    expect(component.html()).toContain(
      '<path d="M12 2L2 7l10 5 10-5-10-5z"></path>',
    )
  })

  it('renders a valid symbol from a specific sprite', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'special/icon',
      },
    })

    expect(component.html()).toContain('data-symbol="icon"')
    expect(component.html()).toContain('viewBox="0 0 16 16"')
    expect(component.html()).toContain('<circle cx="8" cy="8" r="7"></circle>')
  })

  it('renders a symbol that requires async import', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'async-symbol',
      },
    })

    expect(component.html()).toContain('data-symbol="async-symbol"')
    expect(component.html()).toContain('viewBox="0 0 32 32"')
    expect(component.html()).toContain(
      '<rect x="4" y="4" width="24" height="24"></rect>',
    )
  })

  it('renders an empty SVG for an invalid symbol', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'nonexistent-symbol',
      },
    })

    expect(component.html()).toContain('data-symbol="nonexistent-symbol"')
    expect(component.html()).toContain('<svg')
    expect(component.html()).toContain('xmlns="http://www.w3.org/2000/svg"')
    // Should be an empty SVG
    expect(component.html()).not.toContain('viewBox')
    expect(component.html()).not.toContain('<path')
    expect(component.html()).not.toContain('<rect')
    expect(component.html()).not.toContain('<circle')
  })

  it('renders with aria-hidden when ariaHidden is true', async () => {
    runtimeMock.runtimeOptions.ariaHidden = true

    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'valid-symbol',
      },
    })

    expect(component.html()).toContain('aria-hidden="true"')
  })

  it('does not include id attribute from the imported symbol', async () => {
    // Add a symbol with an id attribute that should be removed.
    // @ts-ignore
    symbolImports['with-id'] = {
      attributes: {
        viewBox: '0 0 24 24',
        width: '24',
        height: '24',
        id: 'original-id',
      },
      content: '<path d="M5 5h14v14H5z"></path>',
    }

    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'with-id',
      },
    })

    expect(component.html()).not.toContain('id="original-id"')
  })

  it('renders valid-symbol correctly', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'valid-symbol',
      },
    })

    expect(component.html()).toContain(
      '<path d="M12 2L2 7l10 5 10-5-10-5z"></path>',
    )
  })

  it('renders special/icon correctly', async () => {
    const component = await mountSuspended(SpriteSymbolInline, {
      props: {
        name: 'special/icon',
      },
    })

    expect(component.html()).toContain('<circle cx="8" cy="8" r="7"></circle>')
  })
})
