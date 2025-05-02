import { defineEventHandler } from 'h3'
import { allSymbolNames } from '#nuxt-svg-icon-sprite/runtime'

export default defineEventHandler(() => {
  return allSymbolNames
})
