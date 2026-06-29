<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'

const router = useRouter()
const { setUser } = useAuth()

const username = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const register = async () => {
  errorMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          username: username.value,
          email: email.value,
          password: password.value,
        },
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not create account.')
      return
    }

    setUser(data.user)
    router.push('/')
  } catch {
    errorMessage.value = 'Could not create account.'
  }
}
</script>

<template>
  <section class="auth-shell">
    <header class="page-head">
      <h1>Create your account</h1>
      <p class="page-head-sub">Join Conduit to write and share articles.</p>
    </header>

    <div class="auth-card">
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <form @submit.prevent="register">
        <label>
          Username
          <input v-model="username" autocomplete="username" required />
        </label>

        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <label>
          Password
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <button type="submit">Create account</button>
      </form>
    </div>

    <p class="auth-footer">
      Already have an account? <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </section>
</template>
