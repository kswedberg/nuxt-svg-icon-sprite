import { Sprite } from './Sprite'
import type { ModuleHelper } from './ModuleHelper'
import type { WatchEvent } from 'nuxt/schema'

type Template =
  | 'runtime'
  | 'runtime-types'
  | 'symbol-import'
  | 'symbol-import-types'

function anyChanged(results: boolean[]): boolean {
  return results.some((v) => v === true)
}

export class Collector {
  sprites: Sprite[]
  templates = new Map<Template, string>()

  constructor(private helper: ModuleHelper) {
    this.sprites = Object.entries(helper.options.sprites).map(
      ([key, config]) => {
        return new Sprite(key, config, helper)
      },
    )
  }

  public getTemplate(key: Template): string {
    const contents = this.templates.get(key)
    if (contents === undefined) {
      throw new Error(`Invalid template key: "${key}"`)
    }

    return contents
  }

  async init(): Promise<void> {
    await Promise.all(this.sprites.map((sprite) => sprite.init()))
    await this.updateTemplates()
  }

  private setTemplate(key: Template, contents: string) {
    this.templates.set(key, contents)
  }

  public async updateTemplates() {
    const fileNames: Record<string, string> = {}
    const allSymbols: string[] = []

    for (const sprite of this.sprites) {
      if (this.helper.isDev) {
        const { hash } = await sprite.getSprite()
        fileNames[sprite.name] =
          `/__nuxt/nuxt-svg-icon-sprite/sprite.${sprite.name}.${hash}.svg`
      } else {
        fileNames[sprite.name] =
          this.helper.paths.buildAssetsDir + (await sprite.getSpriteFileName())
      }

      const prefix = sprite.name === 'default' ? '' : sprite.name + '/'
      const processed = await sprite.getProcessedSymbols()
      for (const v of processed) {
        allSymbols.push(prefix + v.symbol.id)
      }
    }

    allSymbols.sort()

    const runtimeOptions = {
      ariaHidden: !!this.helper.options.ariaHidden,
    }

    this.setTemplate(
      'runtime',
      `
export const isServer = import.meta.server
export const spritePaths = Object.freeze(${JSON.stringify(fileNames, null, 2)})
export const runtimeOptions = Object.freeze(${JSON.stringify(runtimeOptions)})
export const allSymbolNames = Object.freeze(${JSON.stringify(allSymbols, null, 2)})
`,
    )

    const NuxtSvgSpriteSymbol =
      allSymbols.map((v) => `"${v}"`).join('\n    | ') || 'string'

    this.setTemplate(
      'runtime-types',
      `
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
}
`,
    )

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
        const importStatement = this.helper.isDev
          ? importMethodInline
          : `import.meta.client ? ${importMethodDynamic} : ${importMethodInline}`

        imports.push(`${JSON.stringify(id)}: ${importStatement}`)
      }
    }

    this.setTemplate(
      'symbol-import',
      `
export const SYMBOL_IMPORTS = {
  ${imports.sort().join(',\n  ')}
}
`,
    )

    this.setTemplate(
      'symbol-import-types',
      `
declare module '#nuxt-svg-icon-sprite/symbol-import' {
  import type { NuxtSvgSpriteSymbol } from './runtime'

  type SymbolImport = {
    content: string
    attributes: Record<string, string>
  }

  type SymbolImportDynamic = () => Promise<SymbolImport>

  export const SYMBOL_IMPORTS: Record<NuxtSvgSpriteSymbol, SymbolImport | SymbolImportDynamic>
}
`,
    )
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

  public async onBuilderWatch(event: WatchEvent, providedPath: string) {
    const isSvgFile = !!providedPath.match(/\.(svg)$/)

    // Make sure the path is always absolute.
    const path = providedPath.startsWith('/')
      ? providedPath
      : this.helper.resolvers.src.resolve(providedPath)

    let hasChanged = false

    if (event === 'add' && isSvgFile) {
      hasChanged = await this.handleAdd(path)
    } else if (event === 'change' && isSvgFile) {
      hasChanged = await this.handleChange(path)
    } else if (event === 'unlink' && isSvgFile) {
      hasChanged = await this.handleUnlink(path)
    } else if (event === 'addDir') {
      hasChanged = await this.handleAddDir()
    } else if (event === 'unlinkDir') {
      hasChanged = await this.handleUnlinkDir(path)
    }

    if (hasChanged) {
      await this.updateTemplates()
    }
  }
}
