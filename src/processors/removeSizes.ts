import { defineProcessor } from './defineProcessor'

/**
 * Removes width and height attribtues from the SVG.
 */
export const removeSizes = defineProcessor(() => {
  return (svg) => {
    svg.removeAttribute('width')
    svg.removeAttribute('height')
  }
})
