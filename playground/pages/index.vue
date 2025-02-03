<template>
  <div>
    <h1 class="font-bold text-5xl mb-8">Test Icons</h1>

    <h2 class="text-2xl font-bold mt-28 mb-10">All symbols via sprite</h2>
    <AllSymbols />

    <h2 class="text-2xl font-bold mt-28 mb-10">All symbols inlined</h2>
    <SymbolImports />

    <MultipleSymbols />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
useHead({
  title: 'SVG Icon Sprite Playground',
})
</script>
