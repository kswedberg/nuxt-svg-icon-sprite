import { h } from 'vue'
import { runtimeOptions } from '#nuxt-svg-icon-sprite/runtime'
import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-icon-sprite/runtime'

export type Props = {
  /**
   * The name of the symbol.
   *
   * Symbols from the default sprite can be referenced directly by their name,
   * e.g. `name="settings"`.
   * Symbols from other sprites must be prefixed by their sprite name, e.g.
   * `name="special/search"`
   */
  name: NuxtSvgSpriteSymbol
}

export function fallback(symbol: string) {
  return () =>
    h('svg', {
      'data-symbol': symbol,
      xmlns: 'http://www.w3.org/2000/svg',
      innerHTML: '',
      'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
    })
}

export function svg(
  symbol: string,
  attributes: Record<string, string>,
  content: string,
) {
  return () =>
    h('svg', {
      'data-symbol': symbol,
      // Pass the attributes from the raw SVG (things like viewBox).
      // Attributes passed to <SpriteSymbol> are automatically added by Vue.
      ...attributes,
      xmlns: 'http://www.w3.org/2000/svg',
      innerHTML: content,
      id: undefined,
      'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
    })
}
