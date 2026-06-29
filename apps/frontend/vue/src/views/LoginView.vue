<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'

const router = useRouter()
const { setUser } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

const login = async () => {
  errorMessage.value = ''

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          email: email.value,
          password: password.value,
        },
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not sign in.')
      return
    }

    setUser(data.user)
    router.push('/')
  } catch {
    errorMessage.value = 'Could not sign in.'
  }
}
</script>

<template>
  <section class="auth-shell">
    <header class="page-head">
      <h1>Sign in</h1>
      <p class="page-head-sub">Welcome back to Conduit.</p>
    </header>

    <div class="auth-card">
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <form @submit.prevent="login">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <label>
          Password
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <button type="submit">Sign in</button>
      </form>
    </div>

    <p class="auth-footer">
      Need an account? <RouterLink to="/register">Create one</RouterLink>
    </p>
  </section>
</template>
