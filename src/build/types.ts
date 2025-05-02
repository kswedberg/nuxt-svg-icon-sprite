import type { Resolver } from '@nuxt/kit'
import type { HTMLElement } from 'node-html-parser'

export type ProcessorContext = {
  id: string
  filePath?: string
}

export type Processor = (
  element: HTMLElement,
  context: ProcessorContext,
) => void | Promise<void>

export type SpriteConfig = {
  /**
   * Array of patterns to scan when building the sprite.
   */
  importPatterns?: string[]

  /**
   * Directly define symbols to include after the automatic imports.
   *
   * Should be an object with the key being the symbol ID and the value the path
   * to the SVG.
   */
  symbolFiles?: Record<string, string>

  /**
   * Process the parsed SVG symbol.
   */
  processSpriteSymbol?: Processor | Processor[]

  /**
   * Process the finished sprite right before it's saved.
   */
  processSprite?: Processor | Processor[]
}

export type RuntimeOptions = {
  ariaHidden: boolean
}

export type ModuleContext = {
  dev: boolean
  srcDir: string
  buildAssetsDir: string
  runtimeOptions: RuntimeOptions
  buildResolver: Resolver
}
