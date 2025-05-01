import type { SpriteSymbolProcessor } from './build/types'

function defineProcessor(cb: SpriteSymbolProcessor): SpriteSymbolProcessor {
  return cb
}

/**
 * Removes width and height attribtues from the SVG.
 */
export const removeSizes = defineProcessor((svg) => {
  svg.removeAttribute('width')
  svg.removeAttribute('height')
})

/**
 * Replaces all stroke and fill colors with "currentColor".
 *
 * If the SVG contains a data-keep-color attribute, the colors are not
 * replaced.
 */
export const forceCurrentColor = defineProcessor((svg) => {
  if (svg.hasAttribute('data-keep-color')) {
    return
  }
  const allElements = svg.querySelectorAll('*')
  const colorAttributes = ['stroke', 'fill']
  allElements.forEach((element) => {
    colorAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (value) {
        element.setAttribute(attribute, 'currentColor')
      }
    })
  })
})
