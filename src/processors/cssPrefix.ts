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

    // Step 1: First scan all CSS for ID and class names to ensure we catch all
    // selectors even if they're not used in the DOM
    const styleTags = svg.querySelectorAll('style')
    styleTags.forEach((styleTag) => {
      const cssText = styleTag.textContent || ''

      // Match all #id selectors in CSS
      const idRegex = /#([a-zA-Z0-9_-]+)(?=[\s,.:{[\]|$])/g
      let idMatch
      while ((idMatch = idRegex.exec(cssText)) !== null) {
        const idName = idMatch[1]
        if (!idMap.has(idName)) {
          idMap.set(idName, PREFIX + idName)
        }
      }

      // Match all .class-name selectors in CSS
      const classRegex = /\.([a-zA-Z0-9_-]+)(?=[\s,.:{[\]|$])/g
      let classMatch
      while ((classMatch = classRegex.exec(cssText)) !== null) {
        const className = classMatch[1]
        if (!classMap.has(className)) {
          classMap.set(className, PREFIX + className)
        }
      }

      // Match all url(#id) references in CSS with various formats
      // This regex handles: url(#id), url("#id"), url('#id'), url( #id ), etc.
      const urlRegex = /url\(\s*['"]?#([^'")]+)['"]?\s*\)/g
      let urlMatch
      while ((urlMatch = urlRegex.exec(cssText)) !== null) {
        const idName = urlMatch[1]
        if (!idMap.has(idName)) {
          idMap.set(idName, PREFIX + idName)
        }
      }
    })

    // Step 2: Process all IDs in the SVG.
    const elementsWithId = svg.querySelectorAll('[id]')
    elementsWithId.forEach((el) => {
      const originalId = el.getAttribute('id')
      if (!idMap.has(originalId)) {
        idMap.set(originalId, PREFIX + originalId)
      }
      el.setAttribute('id', idMap.get(originalId))
    })

    // Step 3: Process all class names in the SVG.
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

    // Step 4: Update CSS selectors in style tags.
    styleTags.forEach((styleTag) => {
      let cssText = styleTag.textContent

      // Replace ID references in CSS.
      idMap.forEach((newId, originalId) => {
        // Match #id in selectors.
        const idRegex = new RegExp(`#${originalId}(?=[\\s,.:{\\[]|$)`, 'g')
        cssText = cssText.replace(idRegex, `#${newId}`)

        // Match url(#id) references with various formats
        // This handles: url(#id), url("#id"), url('#id'), url( #id ), etc.
        const urlWithoutQuotesRegex = new RegExp(
          `(url\\(\\s*)#${originalId}(\\s*\\))`,
          'g',
        )
        cssText = cssText.replace(urlWithoutQuotesRegex, `$1#${newId}$2`)

        const urlWithDoubleQuotesRegex = new RegExp(
          `(url\\(\\s*")#${originalId}("\\s*\\))`,
          'g',
        )
        cssText = cssText.replace(urlWithDoubleQuotesRegex, `$1#${newId}$2`)

        const urlWithSingleQuotesRegex = new RegExp(
          `(url\\(\\s*')#${originalId}('\\s*\\))`,
          'g',
        )
        cssText = cssText.replace(urlWithSingleQuotesRegex, `$1#${newId}$2`)
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

    // Step 5: Update ID references in attributes like href, fill, etc.
    const allElements = svg.querySelectorAll('*')
    allElements.forEach((el) => {
      // Process all attributes that might reference IDs.
      Object.entries(el.attributes).forEach(([name, value]) => {
        // Skip id and class attributes as they've already been processed.
        if (name === 'id' || name === 'class') return

        let newValue = value
        let modified = false

        // Handle url(#id) references (used in fill, stroke, filter, etc.).
        const urlMatches = value.match(/url\(\s*['"]?#([^'")]+)['"]?\s*\)/g)
        if (urlMatches) {
          urlMatches.forEach((match) => {
            // Extract id from url(#id) with various formats
            const idMatch = match.match(/url\(\s*['"]?#([^'")]+)['"]?\s*\)/)
            if (idMatch && idMatch[1]) {
              const idValue = idMatch[1]
              if (idMap.has(idValue)) {
                // Keep the same format (quotes, spaces) but replace the ID
                const replacedUrl = match.replace(
                  `#${idValue}`,
                  `#${idMap.get(idValue)}`,
                )
                newValue = newValue.replace(match, replacedUrl)
                modified = true
              }
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
