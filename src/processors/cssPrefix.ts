import { defineProcessor } from './defineProcessor'

/**
 * Prefixes IDs and class names.
 */
export const cssPrefix = defineProcessor(() => {
  return (svg, ctx) => {
    const PREFIX = ctx.id + '--'

    // Maps to track original to prefixed values.
    const idMap = new Map()
    const classMap = new Map()

    // Step 1: Process all IDs in the SVG.
    const elementsWithId = svg.querySelectorAll('[id]')
    elementsWithId.forEach((el) => {
      const originalId = el.getAttribute('id')
      const newId = PREFIX + originalId
      idMap.set(originalId, newId)
      el.setAttribute('id', newId)
    })

    // Step 2: Process all class names in the SVG.
    const elementsWithClass = svg.querySelectorAll('[class]')
    elementsWithClass.forEach((el) => {
      const originalClassStr = el.getAttribute('class') || ''
      const classNames = originalClassStr.split(/\s+/)

      const newClassNames = classNames.map((className) => {
        if (!className) return className
        if (!classMap.has(className)) {
          classMap.set(className, PREFIX + className)
        }
        return classMap.get(className)
      })

      el.setAttribute('class', newClassNames.join(' '))
    })

    // Step 3: Update CSS selectors in style tags.
    const styleTags = svg.querySelectorAll('style')
    styleTags.forEach((styleTag) => {
      let cssText = styleTag.textContent

      // Replace ID references in CSS.
      idMap.forEach((newId, originalId) => {
        // Match #id in selectors.
        const idRegex = new RegExp(`#${originalId}(?=[\\s,.:{\\[]|$)`, 'g')
        cssText = cssText.replace(idRegex, `#${newId}`)

        // Match url(#id) references.
        const urlRegex = new RegExp(`url\\(#${originalId}\\)`, 'g')
        cssText = cssText.replace(urlRegex, `url(#${newId})`)
      })

      // Replace class references in CSS.
      classMap.forEach((newClass, originalClass) => {
        // Match .class-name in selectors.
        const classRegex = new RegExp(
          `\\.${originalClass}(?=[\\s,.:{\\[]|$)`,
          'g',
        )
        cssText = cssText.replace(classRegex, `.${newClass}`)
      })

      styleTag.textContent = cssText
    })

    // Step 4: Update ID references in attributes like href, fill, etc.
    const allElements = svg.querySelectorAll('*')
    allElements.forEach((el) => {
      // Process all attributes that might reference IDs.
      Object.entries(el.attributes).forEach((attr) => {
        const [name, value] = attr

        // Skip id and class attributes as they've already been processed.
        if (name === 'id' || name === 'class') return

        let newValue = value
        let modified = false

        // Handle url(#id) references (used in fill, stroke, filter, etc.).
        const urlMatches = value.match(/url\(#([^)]+)\)/g)
        if (urlMatches) {
          urlMatches.forEach((match) => {
            // Extract id from url(#id).
            const idValue = match.substring(5, match.length - 1)
            if (idMap.has(idValue)) {
              newValue = newValue.replace(
                `url(#${idValue})`,
                `url(#${idMap.get(idValue)})`,
              )
              modified = true
            }
          })
        }

        // Handle direct #id references (used in href, xlink:href).
        if (value.startsWith('#')) {
          const idValue = value.substring(1)
          if (idMap.has(idValue)) {
            newValue = `#${idMap.get(idValue)}`
            modified = true
          }
        }

        if (modified) {
          el.setAttribute(name, newValue)
        }
      })
    })
  }
})
