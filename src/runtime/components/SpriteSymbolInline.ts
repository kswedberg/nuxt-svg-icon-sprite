import { defineComponent, type PropType, h } from 'vue'
import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-icon-sprite/runtime'
import { runtimeOptions } from '#nuxt-svg-icon-sprite/runtime'
import { symbolImports } from '#nuxt-svg-icon-sprite/symbol-import'
import { getSymbolNameParts } from '../helpers'

const SymbolInline = defineComponent({
  props: {
    name: {
      type: String as PropType<NuxtSvgSpriteSymbol>,
      required: true,
    },
  },
  async setup(props) {
    const { symbol } = getSymbolNameParts(props.name)
    const symbolImport = symbolImports[props.name]

    // Invalid symbol name.
    if (!symbolImport) {
      return () =>
        h('svg', {
          'data-symbol': symbol,
          xmlns: 'http://www.w3.org/2000/svg',
          innerHTML: '',
          'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
        })
    }

    // It's either a method that imports it using import() (client side) or
    // the object itself (server side).
    const result =
      typeof symbolImport === 'function' ? await symbolImport() : symbolImport

    return () =>
      h('svg', {
        'data-symbol': symbol,
        // Pass the attributes from the raw SVG (things like viewBox).
        // Attributes passed to <SpriteSymbol> are automatically added by Vue.
        ...result.attributes,
        xmlns: 'http://www.w3.org/2000/svg',
        innerHTML: result.content,
        id: undefined,
        'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
      })
  },
})

type Props = {
  /**
   * The name of the symbol.
   *
   * Symbols from the default sprite can be referenced directly by their name,
   * e.g. `name="settings"`.
   * Symbols from other sprites must be prefixed by their sprite name, e.g.
   * `name="special/search"`
   */
  name: NuxtSvgSpriteSymbol
}

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

if (import.meta.hot) {
  import.meta.hot.accept()
}
