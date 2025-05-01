import { defineComponent, type PropType, h } from 'vue'
import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-sprite/runtime'
import { runtimeOptions } from '#nuxt-svg-sprite/runtime'
import { SYMBOL_IMPORTS } from '#nuxt-svg-sprite/symbol-import'

const SymbolInline = defineComponent({
  props: {
    name: {
      type: String as PropType<NuxtSvgSpriteSymbol>,
      required: true,
    },
  },
  async setup(props) {
    const [sprite, name] = (props.name || '').split('/')
    const symbolImport = SYMBOL_IMPORTS[props.name]

    // Invalid symbol name.
    if (!symbolImport) {
      return () =>
        h('svg', {
          'data-symbol': name || sprite,
          xmlns: 'http://www.w3.org/2000/svg',
          innerHTML: '',
          'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
        })
    }

    // It's either a method that imports it using import() (client side) or
    // the object itself (server side).
    const symbol =
      typeof symbolImport === 'function' ? await symbolImport() : symbolImport

    return () =>
      h('svg', {
        'data-symbol': name || sprite,
        // Pass the attributes from the raw SVG (things like viewBox).
        // Attributes passed to <SpriteSymbol> are automatically added by Vue.
        ...symbol.attributes,
        xmlns: 'http://www.w3.org/2000/svg',
        innerHTML: symbol.content,
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
 * Renders a <svg> tag containing <use> that references the given symbol from the sprite.
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
      return h(SymbolInline, { name: props.name, key: props.name })
    }
  },
})

if (import.meta.hot) {
  import.meta.hot.accept()
}
