import {
  createResolver,
  defineNuxtModule,
  addTemplate,
  addComponent,
  addImportsDir,
  addTypeTemplate,
  addServerTemplate,
  addDevServerHandler,
  addImports,
} from '@nuxt/kit'
import { createDevServerHandler } from './build/devServerHandler'
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { SpriteConfig, RuntimeOptions } from './build/types'
import { Collector } from './build/Collector'

/**
 * Options for the nuxt-svg-icon-sprite module.
 */
export type ModuleOptions = {
  /**
   * Define the config for each sprite to generate.
   *
   * If a sprite with name `default` is provided the names won't be prefixed.
   */
  sprites: Record<string, SpriteConfig>

  /**
   * Adds aria-hidden="true" to all rendered SVGs.
   */
  ariaHidden?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-svg-icon-sprite',
    configKey: 'svgIconSprite',
    compatibility: {
      nuxt: '^3.15.0',
    },
  },
  defaults: {
    sprites: {},
    ariaHidden: false,
  },
  async setup(moduleOptions, nuxt) {
    const DEV = nuxt.options.dev
    if (!moduleOptions.sprites.default) {
      moduleOptions.sprites.default = {
        importPatterns: ['./assets/symbols/*.svg'],
      }
    }

    const buildResolver = createResolver(nuxt.options.buildDir)

    // The path to the source directory of this module's consumer.
    const srcDir = nuxt.options.srcDir

    const srcResolver = createResolver(srcDir)

    // The path of this module.
    const resolver = createResolver(import.meta.url)

    // Add plugin and transpile runtime directory.
    nuxt.options.build.transpile.push(resolver.resolve('runtime'))

    // Add composables.
    addImports({
      name: 'useSpriteData',
      from: resolver.resolve('./runtime/composables/useSpriteData'),
    })

    // Add the component.
    addComponent({
      filePath: resolver.resolve('./runtime/components/SpriteSymbol'),
      name: 'SpriteSymbol',
      global: true,
    })

    addComponent({
      filePath: resolver.resolve('./runtime/components/SpriteSymbolInline'),
      name: 'SpriteSymbolInline',
      global: true,
    })

    const runtimeOptions: RuntimeOptions = {
      ariaHidden: !!moduleOptions.ariaHidden,
    }

    const buildAssetsDir = withLeadingSlash(
      withTrailingSlash(
        joinURL(
          nuxt.options.app.baseURL.replace(/^\.\//, '/') || '/',
          nuxt.options.app.buildAssetsDir,
        ),
      ),
    )

    const collector = new Collector(moduleOptions.sprites, {
      dev: DEV,
      srcDir,
      buildAssetsDir,
      runtimeOptions,
      buildResolver,
    })

    await collector.init()

    if (DEV) {
      // In dev mode, the sprite is served by this server handler.
      addDevServerHandler({
        handler: createDevServerHandler(collector),
        route: `/__nuxt/nuxt-svg-sprite`,
      })
    } else {
      // For the build the sprite is generated as a dist file.
      for (const sprite of collector.sprites) {
        const fileName = await sprite.getSpriteFileName()
        const path = 'dist/client' + buildAssetsDir + fileName
        addTemplate({
          filename: path,
          write: true,
          getContents: async () => {
            const { content } = await sprite.getSprite()
            return content
          },
        })
      }

      // Output all SVGs during build. These are used when inlining a symbol.
      for (const sprite of collector.sprites) {
        const symbols = await sprite.getProcessedSymbols()

        for (const processed of symbols) {
          addTemplate({
            filename:
              'nuxt-svg-sprite/symbols/' +
              sprite.getPrefix() +
              processed.symbol.id +
              '.js',
            write: true,
            getContents: () => {
              const symbol = {
                content: processed.processed.symbolDom,
                attributes: processed.processed.attributes,
              }
              return `export default ${JSON.stringify(symbol)}`
            },
          })
        }
      }
    }

    // Template containing the types and the relative URL path to the generated
    // sprite.
    nuxt.options.alias['#nuxt-svg-sprite/runtime'] = addTemplate({
      filename: 'nuxt-svg-sprite/runtime.js',
      getContents: () => collector.getRuntimeTemplate(),
    }).dst

    addTypeTemplate({
      filename: 'nuxt-svg-sprite/runtime.d.ts',
      write: true,
      getContents: () => collector.getRuntimeTypeTemplate(),
    })

    // Template containing the raw data (name of symbols, all sprites, symbol DOM, etc.).
    nuxt.options.alias['#nuxt-svg-sprite/data'] = addTemplate({
      filename: 'nuxt-svg-sprite/data.js',
      getContents: () => collector.buildDataTemplate(),
    }).dst

    addServerTemplate({
      filename: '#nuxt-svg-sprite/data',
      getContents: () => collector.buildDataTemplate(),
    })

    addTypeTemplate({
      filename: 'nuxt-svg-sprite/data.d.ts',
      write: true,
      getContents: () => collector.buildDataTypeTemplate(),
    })

    // Contains the imports for all symbols.
    nuxt.options.alias['#nuxt-svg-sprite/symbol-import'] = addTemplate({
      filename: 'nuxt-svg-sprite/symbol-import.js',
      getContents: () => collector.buildSymbolImportTemplate(),
    }).dst

    addTypeTemplate({
      filename: 'nuxt-svg-sprite/symbol-import.d.ts',
      write: true,
      getContents: () => collector.buildSymbolImportTypeTemplate(),
    })

    nuxt.hook('builder:watch', async (event, providedPath) => {
      const isSvgFile = !!providedPath.match(/\.(svg)$/)

      // Make sure the path is always absolute.
      const path = providedPath.startsWith('/')
        ? providedPath
        : srcResolver.resolve(providedPath)

      if (event === 'add' && isSvgFile) {
        await collector.handleAdd(path)
      } else if (event === 'change' && isSvgFile) {
        await collector.handleChange(path)
      } else if (event === 'unlink' && isSvgFile) {
        await collector.handleUnlink(path)
      } else if (event === 'addDir') {
        await collector.handleAddDir()
      } else if (event === 'unlinkDir') {
        await collector.handleUnlinkDir(path)
      }
    })
  },
})
