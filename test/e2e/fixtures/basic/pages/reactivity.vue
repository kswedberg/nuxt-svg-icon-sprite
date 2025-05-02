<template>
  <div>
    <div id="buttons">
      <button
        v-for="symbol in symbols"
        :key="'button-' + symbol"
        :data-symbol-button="symbol"
        @click="activeSymbol = symbol"
      >
        {{ symbol }}
      </button>
    </div>

    <div id="sprite-symbol">
      <SpriteSymbol :name="activeSymbol" />
    </div>

    <div id="sprite-symbol-inline">
      <SpriteSymbolInline :name="activeSymbol" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NuxtSvgSpriteSymbol } from '#nuxt-svg-icon-sprite/runtime'

const data = useSpriteData()

const symbols = data.symbols.sort()

const activeSymbol = ref<NuxtSvgSpriteSymbol>(symbols[0])
</script>
