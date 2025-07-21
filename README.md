# Nuxt SVG Symbol Sprite

**_This is a TEMPORARY fork of the `nuxt-svg-icon-sprite` module_**

An easy and performant way to use SVG icons in your Nuxt 3 app.

Automatically creates
[SVG `<symbol>` sprites](https://www.sitepoint.com/use-svg-image-sprites/)
during the build and provides components and composables to use these icons.

- Aggregate all SVG files into one or more sprite files
- Reduce bundle size and SSR-rendered page size
- Full HMR support
- Provides `<SpriteSymbol>` component to render `<svg>` with `<use>`
- Provides `<SpriteSymbolInline>` component to inline the SVG
- Loads the sprite.svg from URL (/\_nuxt/sprite.svg)
- TypeScript type checking for available symbols

## Install

```bash
npm install --save nuxt-svg-symbol-sprite
```

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-svg-symbol-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
      },
    },
  },
})
```

## Usage

Place the icons in the folder defined in `nuxt.config.ts`. By default, it's
`./assets/icons`. The name of the SVG file determines the symbol name.

**NOTE: Each symbol in a sprite must have a unique name!**

So, if you have a file in `./assets/icons/user.svg`, the sprite will contain a
`<symbol>` with the id `user`.

You can now use the symbol with the provided component:

```vue
<SpriteSymbol name="user" />
```

This will render the following markup:

```html
<svg>
  <use xlink:href="/_nuxt/sprite.svg#user"></use>
</svg>
```

The symbol is referenced from the sprite via URL.

## Multiple Sprites

If you have a lot of icons, it might make sense to split them into separate
sprites.

A typical example would be to have SVGs that appear on every page (navbar, logo,
footer, etc.) in the "default" sprite and put page-specific SVGs in separate
sprites.

To create an additional sprite, just define a new property on the `sprites`
config object:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-svg-symbol-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
      },
      dashboard: {
        importPatterns: ['./assets/icons-dashboard/**/*.svg'],
      },
    },
  },
})
```

Assuming you have this file `~/assets/icons-dashboard/billing.svg`, you can
reference it like this:

```vue
<SpriteSymbol name="dashboard/billing" />
```

The symbol name is prefixed by the name of the sprite (e.g., the key used in the
`sprites` config). The `default` sprite is always unprefixed.

## `<SpriteSymbol>` component

In addition to the `name` prop, you can optionally pass the `noWrapper` prop to
only render the `<use>` tag:

```vue
<SpriteSymbol name="dashboard/billing" :no-wrapper="true" />
```

This will render the following markup:

```html
<use xlink:href="/_nuxt/sprite-dashboard.svg#billing"></use>
```

This is useful if you want to render multiple symbols in one `<svg>` tag.

You may also use the `<SpriteSymbolInline />` component to render the SVG
content directly instead of rendering the `<use>` tag. Note that this will load
the entire sprite, not just the symbol to be inlined.

```vue
<SpriteSymbolInline name="search" />
```

This will render the contents of the SVG file as-is, without any wrapper.

## `useSpriteData()` composable

Get information about the generated sprites and their symbols during runtime.

Useful if you want to render a list of all symbols in a style guide:

```vue
<template>
  <SpriteSymbol v-for="symbol in symbols" :key="symbol" :name="symbol" />
</template>

<script setup lang="ts">
const { symbols } = useSpriteData()
</script>
```

## Processing SVG Files

By default, the collected SVG symbols are used as-is, including any attributes
such as `width` or `height`. You can optionally provide processors to alter the
parsed SVG before it is added to the sprite.

The module exports a few processors you can use:

```typescript
import { removeSizes, forceCurrentColor } from 'nuxt-svg-icon-sprite/processors'

export default defineNuxtConfig({
  modules: ['nuxt-svg-icon-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
        processSpriteSymbol: [removeSizes(), forceCurrentColor()],
      },
    },
  },
})
```

### removeSizes()

This processor will remove `width` and `height` attributes on the `<svg>` tag.

### forceCurrentColor()

This processor will replace all `fill` and `stroke` attribute values with
`currentColor`. If you still want to keep some stroke or fill attributes, you
can add a `data-keep-color` attribute on them - those will then be skipped.

### cssPrefix() (Experimental)

Prefixes all IDs and classes in a SVG, including `<style>` selectors. Note that
it does not prefix other selectors (e.g. `path {}`) - these will be shared for
all symbols in the sprite!

### removeTags()

Removes the given tags. For example, to remove all `<title>` tags from the SVG:

```typescript
import { removeTags } from 'nuxt-svg-icon-sprite/processors'

export default defineNuxtConfig({
  modules: ['nuxt-svg-icon-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
        processSpriteSymbol: [removeTags({ tags: ['title'] })],
      },
    },
  },
})
```

### Custom Processors

You can also provide your own processors as inline methods:

```typescript
import { removeSizes, forceCurrentColor } from 'nuxt-svg-icon-sprite/processors'

export default defineNuxtConfig({
  modules: ['nuxt-svg-icon-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
        processSpriteSymbol: [
          (svg) => {
            // Removes all <title> tags.
            const titles = svg.querySelectorAll('title')
            titles.forEach((title) => title.remove())
          },
        ],
      },
    },
  },
})
```

## Full Module Options

```typescript
import type { HTMLElement } from 'node-html-parser'

export default defineNuxtConfig({
  modules: ['nuxt-svg-symbol-sprite'],

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],

        // Directly provide symbol SVG by path.
        // These are added after the auto imports defined in
        // `importPatterns`.
        symbolFiles: {
          email: '~/node_modules/some_package/assets/icons/email.svg',
        },

        processSpriteSymbol(svg: HTMLElement) {
          // Executed for each sprite symbol.

          // Remove width and height attributes from the SVG.
          svg.removeAttribute('width')
          svg.removeAttribute('height')

          // Use 'currentColor' for all fills and strokes.
          const elements = svg.querySelectorAll('*')
          const attributes = ['stroke', 'fill']
          elements.forEach((el) => {
            attributes.forEach((name) => {
              const value = el.getAttribute(name)
              if (value) {
                el.setAttribute(name, 'currentColor')
              }
            })
          })
        },
        processSprite(sprite, ctx) {
          // Executed for each sprite right before it's saved.
          // Run SVGO or whatever you like.
          // Markup contains:
          // <svg>
          //   <symbol id="user">...</symbol>
          //   <symbol id="foobar">...</symbol>
          // </svg>
          // You can directly manipulate the `sprite` object.
        },
      },
    },
  },
})
```

The options are the same for each key in `sprites`.
