import { defineComponent, h } from 'vue'
import { getSymbolNameParts } from '../../helpers'
import { symbolImportsDynamic } from '#nuxt-svg-icon-sprite/symbol-import'
import { fallback, svg, type Props } from './shared'

const SymbolInline = defineComponent({
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  async setup(props) {
    const { symbol } = getSymbolNameParts(props.name)
    const symbolImport = symbolImportsDynamic[props.name]

    // Invalid symbol name.
    if (!symbolImport) {
      return fallback(symbol)
    }

    const result = await symbolImport()
    return svg(symbol, result.attributes, result.content)
  },
})

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
    return () => {
      // Wrapping makes sure that it's reactive.
      return h(SymbolInline, { name: props.name, key: props.name })
    }
  },
})
