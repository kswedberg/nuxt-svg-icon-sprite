import { defineEventHandler } from 'h3'
import { ALL_SPRITES } from '#nuxt-svg-sprite/data'

export default defineEventHandler(() => {
  return ALL_SPRITES
})
