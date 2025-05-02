import type { ModuleContext, SpriteConfig } from './types'
import { Sprite } from './Sprite'

function anyChanged(results: boolean[]): boolean {
  return results.some((v) => v === true)
}

export class Collector {
  sprites: Sprite[]
  context: ModuleContext

  constructor(
    spritesConfig: Record<string, SpriteConfig>,
    context: ModuleContext,
  ) {
    this.sprites = Object.entries(spritesConfig).map(([key, config]) => {
      return new Sprite(key, config, context)
    })
    this.context = context
  }

  async init(): Promise<void> {
    await Promise.all(this.sprites.map((sprite) => sprite.init()))
  }

  async getRuntimeTemplate() {
    const fileNames: Record<string, string> = {}
    const allSymbols: string[] = []

    for (const sprite of this.sprites) {
      if (this.context.dev) {
        const { hash } = await sprite.getSprite()
        fileNames[sprite.name] =
          `/__nuxt/nuxt-svg-icon-sprite/sprite.${sprite.name}.${hash}.svg`
      } else {
        fileNames[sprite.name] =
          this.context.buildAssetsDir + (await sprite.getSpriteFileName())
      }

      const prefix = sprite.name === 'default' ? '' : sprite.name + '/'
      const processed = await sprite.getProcessedSymbols()
      for (const v of processed) {
        allSymbols.push(prefix + v.symbol.id)
      }
    }

    return `
export const isServer = import.meta.server
export const spritePaths = Object.freeze(${JSON.stringify(fileNames, null, 2)})
export const runtimeOptions = Object.freeze(${JSON.stringify(this.context.runtimeOptions)})
export const allSymbolNames = Object.freeze(${JSON.stringify(allSymbols.sort(), null, 2)})
`
  }

  async getRuntimeTypeTemplate() {
    const allSymbols: string[] = []

    for (const sprite of this.sprites) {
      const prefix = sprite.name === 'default' ? '' : sprite.name + '/'
      const processed = await sprite.getProcessedSymbols()
      for (const v of processed) {
        allSymbols.push(JSON.stringify(prefix + v.symbol.id))
      }
    }

    const NuxtSvgSpriteSymbol = allSymbols.sort().join('\n    | ') || 'string'

    return `
declare module '#nuxt-svg-icon-sprite/runtime' {
  /**
   * Keys of all generated SVG sprite symbols.
   */
  export type NuxtSvgSpriteSymbol =
    | ${NuxtSvgSpriteSymbol}

  /**
   * Runtime options of the module.
   */
  export type RuntimeOptions = {
    ariaHidden: boolean
  }

  /**
   * Alias for import.meta.server (used internally for testing).
   */
  export const isServer: boolean;

  /**
   * The absolute path for every sprite.
   */
  export const spritePaths: Readonly<Record<string, string>>;

  /**
   * Runtime options of the module.
   */
  export const runtimeOptions: Readonly<RuntimeOptions>;

  /**
   * An array of all symbol names.
   */
  export const allSymbolNames: Readonly<NuxtSvgSpriteSymbol[]>;
}`
  }

  async buildSymbolImportTemplate() {
    const imports: string[] = []

    for (const sprite of this.sprites) {
      const processed = await sprite.getProcessedSymbols()

      for (const v of processed) {
        const id = sprite.getPrefix() + v.symbol.id

        const importMethodInline = JSON.stringify({
          content: v.processed.symbolDom,
          attributes: v.processed.attributes,
        })
        const importMethodDynamic = `() => import('#build/nuxt-svg-icon-sprite/symbols/${id}').then(v => v.default)`

        // In dev mode, always use the inlined markup.
        // In build, use dynamic import on client and inline on the server.
        const importStatement = this.context.dev
          ? importMethodInline
          : `import.meta.client ? ${importMethodDynamic} : ${importMethodInline}`

        imports.push(`${JSON.stringify(id)}: ${importStatement}`)
      }
    }

    return `export const SYMBOL_IMPORTS = {
  ${imports.sort().join(',\n  ')}
}`
  }

  buildSymbolImportTypeTemplate() {
    return `declare module '#nuxt-svg-icon-sprite/symbol-import' {
  import type { NuxtSvgSpriteSymbol } from './runtime'

  type SymbolImport = {
    content: string
    attributes: Record<string, string>
  }

  type SymbolImportDynamic = () => Promise<SymbolImport>

  export const SYMBOL_IMPORTS: Record<NuxtSvgSpriteSymbol, SymbolImport | SymbolImportDynamic>
}`
  }

  /**
   * SVG file was added.
   */
  async handleAdd(path: string): Promise<boolean> {
    return anyChanged(
      await Promise.all(this.sprites.map((sprite) => sprite.handleAdd(path))),
    )
  }

  /**
   * SVG file was changed.
   */
  async handleChange(path: string): Promise<boolean> {
    return anyChanged(
      await Promise.all(
        this.sprites.map((sprite) => sprite.handleChange(path)),
      ),
    )
  }

  /**
   * SVG file was removed.
   */
  async handleUnlink(path: string): Promise<boolean> {
    return anyChanged(
      await Promise.all(
        this.sprites.map((sprite) => sprite.handleUnlink(path)),
      ),
    )
  }

  /**
   * Any directory was added.
   */
  async handleAddDir(): Promise<boolean> {
    return anyChanged(
      await Promise.all(this.sprites.map((sprite) => sprite.handleAddDir())),
    )
  }

  /**
   * Any directory was removed.
   */
  async handleUnlinkDir(folderPath: string): Promise<boolean> {
    return anyChanged(
      await Promise.all(
        this.sprites.map((sprite) => sprite.handleUnlinkDir(folderPath)),
      ),
    )
  }
}
