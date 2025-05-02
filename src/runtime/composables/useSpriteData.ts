import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-icon-sprite/runtime'
import { spritePaths } from '#nuxt-svg-icon-sprite/runtime'
import { ALL_SYMBOL_KEYS } from '#nuxt-svg-icon-sprite/data'

type SpriteData = {
  /**
   * All symbol names.
   */
  symbols: NuxtSvgSpriteSymbol[]

  /**
   * The absolute paths to the generated sprites.
   */
  spritePaths: Record<string, string>
}

export function useSpriteData(): SpriteData {
  return { symbols: ALL_SYMBOL_KEYS, spritePaths }
}
