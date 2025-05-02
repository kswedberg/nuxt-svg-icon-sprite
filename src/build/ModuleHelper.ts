import {
  addComponent,
  addImports,
  addPlugin,
  addServerImports,
  createResolver,
  resolveAlias,
  type Resolver,
} from '@nuxt/kit'
import { relative } from 'pathe'
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { Nuxt, ResolvedNuxtTemplate } from 'nuxt/schema'
import type { ModuleOptions } from './types'
import { defu } from 'defu'

type ModuleHelperResolvers = {
  /**
   * Resolver for paths relative to the module root.
   */
  module: Resolver

  /**
   * Resolve relative to the app's server directory.
   */
  server: Resolver

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
  root: string
  nuxtConfig: string
  serverDir: string
  srcDir: string
  moduleBuildDir: string
  buildAssetsDir: string
}

export class ModuleHelper {
  public readonly resolvers: ModuleHelperResolvers
  public readonly paths: ModuleHelperPaths

  public readonly isDev: boolean

  public readonly options: ModuleOptions

  private nitroExternals: string[] = []
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
      server: createResolver(nuxt.options.serverDir),
      src: srcResolver,
      app: createResolver(nuxt.options.dir.app),
      root: rootResolver,
    }

    this.paths = {
      root: nuxt.options.rootDir,
      nuxtConfig: this.resolvers.root.resolve('nuxt.config.ts'),
      serverDir: nuxt.options.serverDir,
      srcDir: nuxt.options.srcDir,
      moduleBuildDir: nuxt.options.buildDir + '/nuxt-svg-icon-sprite',
      buildAssetsDir: withLeadingSlash(
        withTrailingSlash(
          joinURL(
            nuxt.options.app.baseURL.replace(/^\.\//, '/') || '/',
            nuxt.options.app.buildAssetsDir,
          ),
        ),
      ),
    }
  }

  /**
   * Transform the path relative to the module's build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toModuleBuildRelative(path: string): string {
    return relative(this.paths.moduleBuildDir, path)
  }

  /**
   * Transform the path relative to the Nuxt build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toBuildRelative(path: string): string {
    return relative(this.nuxt.options.buildDir, path)
  }

  public addAlias(name: string, path: string) {
    this.nuxt.options.alias[name] = path

    // In our case, the name of the alias corresponds to a folder in the build
    // dir with the same name (minus the #).
    const pathFromName = `./${name.substring(1)}`

    this.tsPaths[name] = pathFromName
    this.tsPaths[name + '/*'] = pathFromName + '/*'

    // Add the alias as an external so that the nitro server build doesn't fail.
    this.inlineNitroExternals(name)
  }

  public inlineNitroExternals(arg: ResolvedNuxtTemplate | string) {
    const path = typeof arg === 'string' ? arg : arg.dst
    this.nitroExternals.push(path)
    this.transpile(path)
  }

  public transpile(path: string) {
    this.nuxt.options.build.transpile.push(path)
  }

  public applyBuildConfig() {
    // Workaround for https://github.com/nuxt/nuxt/issues/28995
    this.nuxt.options.nitro.externals ||= {}
    this.nuxt.options.nitro.externals.inline ||= []
    this.nuxt.options.nitro.externals.inline.push(...this.nitroExternals)

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

  public addPlugin(name: string) {
    addPlugin(this.resolvers.module.resolve('./runtime/plugins/' + name), {
      append: false,
    })
  }

  public addComposable(name: string) {
    addImports({
      from: this.resolvers.module.resolve('./runtime/composables/' + name),
      name,
    })
  }

  public addComponent(name: string) {
    addComponent({
      filePath: this.resolvers.module.resolve('./runtime/components/' + name),
      name,
      global: true,
    })
  }

  public addServerUtil(name: string) {
    addServerImports([
      {
        from: this.resolvers.module.resolve('./runtime/server/utils/' + name),
        name,
      },
    ])
  }
}
