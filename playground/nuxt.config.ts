import path from 'path'
import {
  forceCurrentColor,
  removeSizes,
  cssPrefix,
  defineProcessor,
} from './../src/processors'

const importPattern = path.resolve(__dirname, './assets/symbols') + '/**/*.svg'

const removeTitle = defineProcessor(() => {
  return (svg) => {
    const titles = svg.querySelectorAll('title')
    titles.forEach((title) => title.remove())
  }
})

const forceAlienFill = defineProcessor(() => {
  return (svg, ctx) => {
    if (ctx.id === 'alien') {
      const path = svg.querySelector('path')
      if (path) {
        path.setAttribute('fill', 'red')
      }
    }
  }
})

const symbolProcessors = [
  // Removes width and height from SVG.
  removeSizes(),
  // Replaces stroke and fill attributes with currentColor.
  forceCurrentColor(),
  cssPrefix(),
  removeTitle(),
  forceAlienFill(),
]

export default defineNuxtConfig({
  modules: ['./../src/module', '@nuxt/eslint'],

  debug: false,

  imports: {
    autoImport: false,
  },

  routeRules: {
    '/spa/**': { ssr: false },
  },

  app: {
    buildAssetsDir: '/custom-build-assets-dir',
  },

  vite: {
    build: {
      minify: false,
    },
    server: {
      watch: {
        usePolling: true,
      },
    },
  },

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: [importPattern],
        symbolFiles: {
          email: '~/assets/email.svg',
        },
        processSpriteSymbol: symbolProcessors,
      },
      special: {
        importPatterns: ['./assets/symbols-special/**/*.svg'],
        processSpriteSymbol: symbolProcessors,
      },
    },
    ariaHidden: true,
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  compatibilityDate: '2024-08-25',
})
