import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-icon-sprite/runtime'
import { spritePaths, allSymbolNames } from '#nuxt-svg-icon-sprite/runtime'

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

export function useSpriteData(): SpriteData {
  return { symbols: allSymbolNames, spritePaths }
}
