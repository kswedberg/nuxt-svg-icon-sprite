<template>
  <div>
    <div id="sprite-symbol">
      <div
        v-for="symbol in data.symbols"
        :id="'symbol-' + symbol"
        :key="symbol"
      >
        <SpriteSymbol :name="symbol" />
      </div>
    </div>

    <div id="sprite-symbol-inline">
      <div
        v-for="symbol in data.symbols"
        :id="'symbol-inline-' + symbol"
        :key="symbol + 'inline'"
      >
        <SpriteSymbolInline :name="symbol" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const data = useSpriteData()
</script>
