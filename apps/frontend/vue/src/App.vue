<template>
  <header class="site-header">
    <div class="site-header-inner">
      <RouterLink to="/" class="brand">Conduit</RouterLink>

      <nav class="site-nav" aria-label="Main navigation">
        <template v-if="isLoggedIn">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/feed" class="nav-link">Feed</RouterLink>
          <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
          <RouterLink
            v-if="user"
            :to="`/profiles/${user.username}`"
            class="nav-link nav-user"
          >
            {{ user.username }}
          </RouterLink>
          <button type="button" class="nav-logout" @click="logout">Sign out</button>
        </template>

        <template v-else>
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/login" class="nav-link">Sign in</RouterLink>
          <RouterLink to="/register" class="nav-link nav-cta">Sign up</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <div v-if="sessionExpired" class="app-notice" role="status">
    <div class="app-notice-inner">
      <span>Your session has expired.</span>
      <RouterLink to="/login" @click="dismissSessionExpired">Sign in again</RouterLink>
      <button type="button" class="app-notice-dismiss" @click="dismissSessionExpired">
        Dismiss
      </button>
    </div>
  </div>

  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'

const { user, isLoggedIn, sessionExpired, logout, dismissSessionExpired } = useAuth()
</script>
