<template>
  <header>
    <nav>
      <RouterLink to="/">Conduit</RouterLink>
      <RouterLink to="/register">Register</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped></style>
