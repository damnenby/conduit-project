<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

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
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not register.'
      return
    }

    setUser(data.user)
    router.push('/')
  } catch {
    errorMessage.value = 'Could not register.'
  }
}
</script>

<template>
  <section>
    <h1>Register</h1>

    <p v-if="errorMessage">{{ errorMessage }}</p>

    <form @submit.prevent="register">
      <label>
        Username
        <input v-model="username" required />
      </label>

      <label>
        Email
        <input v-model="email" type="email" required />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required />
      </label>

      <button type="submit">Register</button>
    </form>
  </section>
</template>
