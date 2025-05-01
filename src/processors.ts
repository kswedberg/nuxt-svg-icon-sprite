import type { SpriteSymbolProcessor } from './build/types'

function defineProcessor<
  T extends object,
  HasOptions = object extends T ? true : false,
>(
  processor: (options?: T) => SpriteSymbolProcessor,
): HasOptions extends true
  ? (options?: T) => SpriteSymbolProcessor
  : (options: T) => SpriteSymbolProcessor {
  return processor
}

/**
 * Removes width and height attribtues from the SVG.
 */
export const removeSizes = defineProcessor(() => {
  return (svg) => {
    svg.removeAttribute('width')
    svg.removeAttribute('height')
  }
})

/**
 * Replaces all stroke and fill colors with "currentColor".
 *
 * If the SVG contains a data-keep-color attribute, the colors are not
 * replaced.
 */
export const forceCurrentColor = defineProcessor<{
  /**
   * The attribute to use to skip replacing colors.
   * Defaults to "data-keep-color".
   */
  ignoreAttribute?: string
}>((options) => {
  const ignoreAttribute = options?.ignoreAttribute || 'data-keep-color'
  return (svg) => {
    if (svg.hasAttribute(ignoreAttribute)) {
      svg.removeAttribute(ignoreAttribute)
      return
    }
    const allElements = svg.querySelectorAll('*')
    const colorAttributes = ['stroke', 'fill']
    allElements.forEach((element) => {
      if (element.hasAttribute(ignoreAttribute)) {
        element.removeAttribute(ignoreAttribute)
        return
      }

      colorAttributes.forEach((attribute) => {
        const value = element.getAttribute(attribute)
        if (value) {
          element.setAttribute(attribute, 'currentColor')
        }
      })
    })
  }
})
