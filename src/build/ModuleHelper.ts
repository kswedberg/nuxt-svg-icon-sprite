import {
  addComponent,
  addImports,
  createResolver,
  resolveAlias,
  type Resolver,
} from '@nuxt/kit'
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { Component, Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './types'
import { defu } from 'defu'

type ModuleHelperResolvers = {
  /**
   * Resolver for paths relative to the module root.
   */
  module: Resolver

  /**
   * Resolve relative to the Nuxt src folder.
   */
  src: Resolver

  /**
   * Resolve relative to the Nuxt app directory.
   */
  app: Resolver

  /**
   * Resolve relative to the Nuxt root.
   *
   * Should be where nuxt.config.ts is located.
   */
  root: Resolver
}

type ModuleHelperPaths = {
  /**
   * Path of the Nuxt root directory.
   */
  root: string

  /**
   * Path of the Nuxt source directory.
   */
  srcDir: string

  /**
   * Path of this module's build directory.
   */
  moduleBuildDir: string

  /**
   * Path of the public assets of this module.
   */
  buildAssetsDir: string
}

export class ModuleHelper {
  /**
   * Resolvers.
   */
  public readonly resolvers: ModuleHelperResolvers

  /**
   * Paths.
   */
  public readonly paths: ModuleHelperPaths

  /**
   * True if we are in dev mode.
   */
  public readonly isDev: boolean

  /**
   * The merged and prepared options.
   */
  public readonly options: ModuleOptions

  /**
   * The paths we need to add to tsconfig.
   */
  private tsPaths: Record<string, string> = {}

  constructor(
    public readonly nuxt: Nuxt,
    moduleUrl: string,
    options: ModuleOptions,
  ) {
    const mergedOptions: ModuleOptions = defu(
      {
        sprites: {},
      },
      options,
    )

    if (!mergedOptions.sprites.default) {
      mergedOptions.sprites.default = {
        importPatterns: ['./assets/symbols/*.svg'],
      }
    }

    // Gather all aliases for each layer.
    const layerAliases = nuxt.options._layers.map((layer) => {
      // @see https://nuxt.com/docs/api/nuxt-config#alias
      return {
        '~~': layer.config.rootDir,
        '@@': layer.config.rootDir,
        '~': layer.config.srcDir,
        '@': layer.config.srcDir,
        // Merge any additional aliases defined by the layer.
        // Must be last so that the layer may override the "default" aliases.
        ...(layer.config.alias || {}),
      }
    })

    // Resolver for the root directory.
    const srcResolver = createResolver(nuxt.options.srcDir)
    const rootResolver = createResolver(nuxt.options.rootDir)

    const spriteKeys = Object.keys(mergedOptions.sprites)
    for (const key of spriteKeys) {
      if (mergedOptions.sprites[key].importPatterns) {
        mergedOptions.sprites[key].importPatterns = mergedOptions.sprites[
          key
        ].importPatterns.flatMap((pattern) => {
          if (pattern.startsWith('!') || pattern.startsWith('/')) {
            // Skip resolving for ignore patterns or absolute paths.
            return pattern
          } else if (pattern.startsWith('~') || pattern.startsWith('@')) {
            // Any of the internal Nuxt aliases need to be resolved for each layer.
            // @see https://nuxt.com/docs/api/nuxt-config#alias
            return layerAliases.map((aliases) => resolveAlias(pattern, aliases))
          }

          // The path starts with a dot, so we resolve it relative to the app root
          // directory, which is where the nuxt.config.ts file is located.
          return rootResolver.resolve(pattern)
        })
      }
    }

    this.options = mergedOptions
    this.isDev = nuxt.options.dev

    this.resolvers = {
      module: createResolver(moduleUrl),
      src: srcResolver,
      app: createResolver(nuxt.options.dir.app),
      root: rootResolver,
    }

    this.paths = {
      root: nuxt.options.rootDir,
      srcDir: nuxt.options.srcDir,
      moduleBuildDir: nuxt.options.buildDir + '/nuxt-svg-icon-sprite',
      buildAssetsDir: withLeadingSlash(
        withTrailingSlash(nuxt.options.app.buildAssetsDir),
      ),
    }
  }

  public addAlias(name: string, path: string) {
    this.nuxt.options.alias[name] = path

    // In our case, the name of the alias corresponds to a folder in the build
    // dir with the same name (minus the #).
    const pathFromName = `./${name.substring(1)}`

    this.tsPaths[name] = pathFromName
    this.tsPaths[name + '/*'] = pathFromName + '/*'
  }

  public transpile(path: string) {
    this.nuxt.options.build.transpile.push(path)
  }

  public applyBuildConfig() {
    // Currently needed due to a bug in Nuxt that does not add aliases for
    // nitro. As this has happened before in the past, let's leave it so that
    // we are guaranteed to have these aliases also for server types.
    this.nuxt.options.nitro.typescript ||= {}
    this.nuxt.options.nitro.typescript.tsConfig ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths ||= {}

    this.nuxt.options.typescript.tsConfig ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions.paths ||= {}

    for (const [name, path] of Object.entries(this.tsPaths)) {
      this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths[name] =
        [path]
      this.nuxt.options.typescript.tsConfig.compilerOptions.paths[name] = [path]
    }
  }

  public addComposable(name: string) {
    addImports({
      from: this.resolvers.module.resolve('./runtime/composables/' + name),
      name,
    })
  }

  public addComponent(name: string, file: string, mode: Component['mode']) {
    addComponent({
      filePath: this.resolvers.module.resolve(
        `./runtime/components/${name}/${file}`,
      ),
      name,
      mode,
      global: true,
    })
  }
}
