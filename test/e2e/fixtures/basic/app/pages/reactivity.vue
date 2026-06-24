<template>
  <div>
    <div id="buttons">
      <button
        v-for="symbol in data.symbols"
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
import { useSpriteData, ref } from '#imports'

const data = useSpriteData()

const activeSymbol = ref<NuxtSvgSpriteSymbol>(data.symbols[0])
</script>
