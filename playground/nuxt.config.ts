import path from 'path'
import { forceCurrentColor, removeSizes } from './../src/processors'

const importPattern = path.resolve(__dirname, './assets/symbols') + '/**/*.svg'

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
        processSpriteSymbol: [
          // Removes width and height from SVG.
          removeSizes,
          // Replaces stroke and fill attributes with currentColor.
          forceCurrentColor,
          // Removes all <title> tags.
          (svg) => {
            const titles = svg.querySelectorAll('title')
            titles.forEach((title) => title.remove())
          },
          // Sets a fill on one specific icon.
          (svg, ctx) => {
            if (ctx.id === 'alien') {
              const path = svg.querySelector('path')
              if (path) {
                path.setAttribute('fill', 'red')
              }
            }
          },
        ],
      },
      special: {
        importPatterns: ['./assets/symbols-special/**/*.svg'],
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
