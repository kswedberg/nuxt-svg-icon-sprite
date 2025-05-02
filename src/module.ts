import {
  defineNuxtModule,
  addTemplate,
  addTypeTemplate,
  addDevServerHandler,
  addServerTemplate,
} from '@nuxt/kit'
import { createDevServerHandler } from './build/devServerHandler'
import type { ModuleOptions } from './build/types'
import { Collector } from './build/Collector'
import { ModuleHelper } from './build/ModuleHelper'

export type { ModuleOptions }

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
    const helper = new ModuleHelper(nuxt, import.meta.url, moduleOptions)

    helper.addAlias('#nuxt-svg-icon-sprite', helper.paths.moduleBuildDir)
    helper.transpile(helper.resolvers.module.resolve('runtime'))

    helper.addComposable('useSpriteData')

    helper.addComponent('SpriteSymbol')
    helper.addComponent('SpriteSymbolInline')

    const collector = new Collector(helper)

    await collector.init()

    if (helper.isDev) {
      // In dev mode, the sprite is served by this server handler.
      addDevServerHandler({
        handler: createDevServerHandler(collector),
        route: `/__nuxt/nuxt-svg-icon-sprite`,
      })
    } else {
      // For the build the sprite is generated as a dist file.
      for (const sprite of collector.sprites) {
        const fileName = await sprite.getSpriteFileName()
        const path = 'dist/client' + helper.paths.buildAssetsDir + fileName
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
              'nuxt-svg-icon-sprite/symbols/' +
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

    addTemplate({
      filename: 'nuxt-svg-icon-sprite/runtime.js',
      getContents: () => collector.getTemplate('runtime'),
    })

    addServerTemplate({
      filename: '#nuxt-svg-icon-sprite/runtime',
      getContents: () => collector.getTemplate('runtime'),
    })

    addTypeTemplate(
      {
        filename: 'nuxt-svg-icon-sprite/runtime.d.ts',
        write: true,
        getContents: () => collector.getTemplate('runtime-types'),
      },
      {
        nitro: true,
        nuxt: true,
      },
    )

    addTemplate({
      filename: 'nuxt-svg-icon-sprite/symbol-import.js',
      getContents: () => collector.getTemplate('symbol-import'),
    })

    addTypeTemplate(
      {
        filename: 'nuxt-svg-icon-sprite/symbol-import.d.ts',
        write: true,
        getContents: () => collector.getTemplate('symbol-import-types'),
      },
      {
        nitro: true,
        nuxt: true,
      },
    )

    helper.applyBuildConfig()

    nuxt.hook('builder:watch', async (event, path) => {
      await collector.onBuilderWatch(event, path)
    })
  },
})
