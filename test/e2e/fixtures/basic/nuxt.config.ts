import { defineNuxtConfig } from 'nuxt/config'
import Module, { type ModuleOptions } from './../../../../src/module'

const svgIconSprite: ModuleOptions = {
  sprites: {
    default: {
      importPatterns: ['./assets/symbols/**/*.svg'],
      processSpriteSymbol: (svg, ctx) => {
        if (ctx.id === 'account') {
          svg.setAttribute('data-attribute-from-symbol-processor', 'is-svg')
        }
        const paths = svg.querySelectorAll('path')
        paths.forEach((path) => {
          path.setAttribute('data-attribute-from-symbol-processor', 'path')
        })
      },
      processSprite: (sprite) => {
        const paths = sprite.querySelectorAll('path')
        paths.forEach((path) => {
          path.setAttribute('data-attribute-from-sprite-processor', 'foobar')
        })
      },
    },
    special: {
      importPatterns: ['./assets/symbols-special/**/*.svg'],
      processSpriteSymbol: (svg, ctx) => {
        if (ctx.id === 'cog') {
          const path = svg.querySelector('path')
          if (path) {
            path.setAttribute('data-attribute-from-symbol-processor', 'is-path')
          }
        }
      },
      processSprite: (sprite) => {
        const paths = sprite.querySelectorAll('path')
        paths.forEach((path) => {
          path.setAttribute('data-attribute-from-sprite-processor', 'foobar')
        })
      },
    },
  },
  ariaHidden: true,
}

export default defineNuxtConfig({
  modules: [Module],

  compatibilityDate: '2025-04-27',

  svgIconSprite,
})
