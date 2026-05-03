<template>
  <header>
    <nav>
      <RouterLink to="/">Conduit</RouterLink>
      <RouterLink to="/feed">Feed</RouterLink>

      <template v-if="isLoggedIn">
        <span>{{ user?.username }}</span>
        <button @click="logout">Logout</button>
      </template>

      <template v-else>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/register">Register</RouterLink>
      </template>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'

const { user, isLoggedIn, logout } = useAuth()
</script>

<style scoped></style>
