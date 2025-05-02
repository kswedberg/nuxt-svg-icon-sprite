import { defineComponent, h } from 'vue'
import { useHead } from '#imports'
import {
  SPRITE_PATHS,
  runtimeOptions,
  isServer,
  type NuxtSvgSpriteSymbol,
} from '#nuxt-svg-icon-sprite/runtime'
import { getSymbolNameParts } from '../helpers'

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

  /**
   * If set, the component does not render a <svg> wrapper.
   */
  noWrapper?: boolean
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

    noWrapper: Boolean,
  },
  setup(props) {
    if (isServer) {
      const { sprite } = getSymbolNameParts(props.name)
      const href = SPRITE_PATHS[sprite]
      if (href) {
        useHead({
          link: [
            {
              rel: 'prefetch',
              href,
              as: 'image',
              type: 'image/svg+xml',
              key: href,
            },
          ],
        })
      }
    }

    return () => {
      const { symbol, sprite } = getSymbolNameParts(props.name)

      // Create the <use> tag.
      const symbolDom = h('use', {
        href: SPRITE_PATHS[sprite] + '#' + symbol,
      })

      return props.noWrapper
        ? symbolDom
        : h(
            'svg',
            {
              xmlns: 'http://www.w3.org/2000/svg',
              'data-symbol': symbol,
              'aria-hidden': runtimeOptions.ariaHidden ? 'true' : undefined,
            },
            symbolDom,
          )
    }
  },
})

if (import.meta.hot) {
  import.meta.hot.accept()
}
