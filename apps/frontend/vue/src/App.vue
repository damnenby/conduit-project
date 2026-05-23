<template>
  <header>
    <nav>
      <RouterLink to="/">Conduit</RouterLink>

      <template v-if="isLoggedIn">
        <RouterLink to="/feed">Feed</RouterLink>
        <RouterLink to="/editor">New Article</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
        <RouterLink v-if="user" :to="`/profiles/${user.username}`">
          {{ user.username }}
        </RouterLink>
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
