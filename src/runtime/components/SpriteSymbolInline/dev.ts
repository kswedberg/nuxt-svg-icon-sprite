import { defineComponent, h } from 'vue'
import type { Props } from './shared'
import Server from './server'

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
      return h(Server, { name: props.name, key: props.name })
    }
  },
})

if (import.meta.hot) {
  import.meta.hot.accept()
}
