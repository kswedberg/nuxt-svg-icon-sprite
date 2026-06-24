<template>
  <div class="p-4">
    <nav aria-label="Main" class="flex gap-4">
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/spa">SPA</NuxtLink>
    </nav>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
