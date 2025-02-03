<template>
  <div class="p-4">
    <div class="flex gap-4">
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/spa">SPA</NuxtLink>
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts"></script>

<style></style>
