<template>
  <div>
    <h1 class="font-bold text-5xl mb-2">Test Icons</h1>
    <div class="mb-2">
      <nuxt-link class="text-blue-700" to="/spa/nested">nested route</nuxt-link>
    </div>
    <AllSymbols />

    <MultipleSymbols />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
useHead({
  title: 'SPA - SVG Icon Sprite Playground',
})
</script>
