import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-symbol-sprite/runtime'
import { spritePaths, allSymbolNames } from '#nuxt-svg-symbol-sprite/runtime'

type SpriteData = {
  /**
   * All symbol names.
   */
  symbols: Readonly<NuxtSvgSpriteSymbol[]>

  /**
   * The absolute paths to the generated sprites.
   */
  spritePaths: Readonly<Record<string, string>>
}

/**
 * Use data about the generated sprite symbols.
 */
export function useSpriteData(): SpriteData {
  return { symbols: allSymbolNames, spritePaths }
}
