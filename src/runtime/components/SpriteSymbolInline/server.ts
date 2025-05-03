import { defineComponent } from 'vue'
import { symbolImportsInline } from '#nuxt-svg-icon-sprite/symbol-import'
import { getSymbolNameParts } from '../../helpers'
import { fallback, svg, type Props } from './shared'

/**
 * Inline a sprite symbol.
 */
export default defineComponent<Props>({
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { symbol } = getSymbolNameParts(props.name)
    const symbolImport = symbolImportsInline[props.name]

    // Invalid symbol name.
    if (!symbolImport) {
      return fallback(symbol)
    }

    return svg(symbol, symbolImport.attributes, symbolImport.content)
  },
})
