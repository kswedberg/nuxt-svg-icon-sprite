import path from 'path'

const importPattern = path.resolve(__dirname, './assets/symbols') + '/**/*.svg'

export default defineNuxtConfig({
  modules: ['./../src/module'],
  app: {
    buildAssetsDir: '/zuxt/',
  },
  imports: {
    autoImport: false,
  },
  devServer: {
    port: 3099,
  },
  routeRules: {
    '/spa/**': { ssr: false },
  },

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: [importPattern],
        symbolFiles: {
          email: '~/assets/email.svg',
        },
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

  compatibilityDate: '2025-04-03',
})
