<template>
  <div>
    <h1 class="font-bold text-5xl mb-8">Test Icons</h1>

    <AllSymbols />

    <MultipleSymbols />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
useHead({
  title: 'Nested Route - SVG Icon Sprite Playground',
})
</script>
