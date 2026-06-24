<template>
  <svg class="multiple-symbols aspect-square mx-auto" viewBox="0 0 1000 1000">
    <SpriteSymbol
      v-for="n in TOTAL"
      :key="n"
      :no-wrapper="true"
      name="special/silhouette"
      width="1000"
      height="1000"
      x="0"
      y="0"
      transform-origin="center"
      :transform="getTransform(n)"
      :class="getClass(n)"
    />
  </svg>
</template>

<script lang="ts" setup>
const TOTAL = 20

function getTransform(n: number) {
  const v = ((TOTAL - n - 1) / (TOTAL - 5)) % 1.75
  return `scale(${v})`
}

const COLOR_CLASSES = [
  'fill-yellow-400',
  'fill-stone-800',
  'fill-blue-800',
  'fill-cyan-100',
  'fill-red-600',
  'fill-red-200',
]

function getClass(n: number) {
  return COLOR_CLASSES[n % COLOR_CLASSES.length]
}
</script>

<style type="postcss">
.multiple-symbols {
  width: calc(100vmin - 20rem);
}
</style>
