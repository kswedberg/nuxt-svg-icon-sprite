import { defineEventHandler } from 'h3'
import { allSymbolNames } from '#nuxt-svg-symbol-sprite/runtime'

export default defineEventHandler(() => {
  return allSymbolNames
})
