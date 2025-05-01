import { defineComponent, h } from 'vue'
import { useHead } from '#imports'
import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-sprite/runtime'
import { SPRITE_PATHS, runtimeOptions } from '#nuxt-svg-sprite/runtime'

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
    if (import.meta.server) {
      const [sprite, name] = (props.name || '').split('/')
      const href = SPRITE_PATHS[name ? sprite : 'default']
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
      // Split the name, which is either the symbol name of the default sprite
      // (e.g. "user") or prefixed to a custom sprite ("dashboard/billing").
      const [sprite, name] = (props.name || '').split('/')

      // Create the <use> tag.
      const symbolDom = h('use', {
        href: SPRITE_PATHS[name ? sprite : 'default'] + '#' + (name || sprite),
      })

      return props.noWrapper
        ? symbolDom
        : h(
            'svg',
            {
              xmlns: 'http://www.w3.org/2000/svg',
              'data-symbol': name || sprite,
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
