import { defineProcessor } from './defineProcessor'

/**
 * Removes the given tags.
 */
export const removeTags = defineProcessor<{
  tags: string[]
}>((options) => {
  return (svg) => {
    for (const tag of options!.tags) {
      const elements = svg.querySelectorAll(tag)
      elements.forEach((el) => el.remove())
    }
  }
})
