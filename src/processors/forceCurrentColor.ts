import { defineProcessor } from './defineProcessor'

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
        if (value && value !== 'transparent' && value !== 'none') {
          element.setAttribute(attribute, 'currentColor')
        }
      })
    })
  }
})
