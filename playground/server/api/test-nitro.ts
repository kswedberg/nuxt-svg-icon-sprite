import { defineEventHandler } from 'h3'
import { ALL_SYMBOL_KEYS } from '#nuxt-svg-icon-sprite/data'

export default defineEventHandler(() => {
  return ALL_SYMBOL_KEYS
})
