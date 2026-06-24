import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import {
  forceCurrentColor,
  removeSizes,
  cssPrefix,
  defineProcessor,
} from './../src/processors'

const importPattern = path.resolve(__dirname, './app/assets/symbols') + '/**/*.svg'

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
  modules: ['./../src/module', '@nuxt/eslint', '@nuxt/test-utils/module'],

  devServer: {
    port: 3089,
  },
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
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    },
    plugins: [
      tailwindcss(),
    ],
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
        importPatterns: ['./app/assets/symbols-special/**/*.svg'],
        processSpriteSymbol: symbolProcessors,
      },
    },
    ariaHidden: true,
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-08-25',
})
