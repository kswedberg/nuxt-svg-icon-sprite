import { defineEventHandler } from 'h3'
import { ALL_SPRITES } from '#nuxt-svg-icon-sprite/data'

export default defineEventHandler(() => {
  return ALL_SPRITES
})
