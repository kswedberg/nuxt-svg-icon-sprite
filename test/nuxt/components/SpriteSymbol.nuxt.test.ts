import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SpriteSymbol from '~/src/runtime/components/SpriteSymbol'

const { useHeadMock } = vi.hoisted(() => ({
  useHeadMock: vi.fn(),
}))

mockNuxtImport('useHead', () => useHeadMock)

const runtimeMock = vi.hoisted(() => ({
  spritePaths: {
    default: '/sprite-default.svg',
    special: '/sprite-special.svg',
  },
  runtimeOptions: {
    ariaHidden: false,
  },
  isServer: false,
}))

vi.mock('#nuxt-svg-icon-sprite/runtime', () => runtimeMock)

describe('SpriteSymbol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeMock.runtimeOptions.ariaHidden = false
    runtimeMock.isServer = false
  })

  it('renders symbol from default sprite correctly', async () => {
    const component = await mountSuspended(SpriteSymbol, {
      props: {
        name: 'settings',
      },
    })

    expect(component.html()).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" data-symbol="settings"',
    )
    expect(component.html()).toContain(
      '<use href="/sprite-default.svg#settings"></use>',
    )
  })

  it('renders symbol from named sprite correctly', async () => {
    const component = await mountSuspended(SpriteSymbol, {
      props: {
        name: 'special/search',
      },
    })

    expect(component.html()).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" data-symbol="search"',
    )
    expect(component.html()).toContain(
      '<use href="/sprite-special.svg#search"></use>',
    )
  })

  it('renders with aria-hidden when ariaHidden is true', async () => {
    runtimeMock.runtimeOptions.ariaHidden = true

    const component = await mountSuspended(SpriteSymbol, {
      props: {
        name: 'settings',
      },
    })

    expect(component.html()).toContain('aria-hidden="true"')
  })

  it('renders without wrapper when noWrapper is true', async () => {
    const component = await mountSuspended(SpriteSymbol, {
      props: {
        name: 'settings',
        noWrapper: true,
      },
    })

    // Should only render the use tag without svg wrapper.
    expect(component.html()).not.toContain('<svg')
    expect(component.html()).toContain(
      '<use href="/sprite-default.svg#settings"></use>',
    )
  })

  it('adds prefetch link tag on server side', async () => {
    runtimeMock.isServer = true

    await mountSuspended(SpriteSymbol, {
      props: {
        name: 'settings',
      },
    })

    expect(useHeadMock).toHaveBeenCalledWith({
      link: [
        {
          rel: 'prefetch',
          href: '/sprite-default.svg',
          as: 'image',
          type: 'image/svg+xml',
          key: '/sprite-default.svg',
        },
      ],
    })
  })

  it('does not add prefetch link tag on client side', async () => {
    await mountSuspended(SpriteSymbol, {
      props: {
        name: 'settings',
      },
    })

    expect(useHeadMock).not.toHaveBeenCalled()
  })

  it('does not add prefetch link tag if sprite path is not defined', async () => {
    // Set server-side environment
    runtimeMock.isServer = true

    await mountSuspended(SpriteSymbol, {
      props: {
        name: 'nonexistent/icon',
      },
    })

    expect(useHeadMock).not.toHaveBeenCalled()
  })
})
