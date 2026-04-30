<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

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
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not login.'
      return
    }

    setUser(data.user)
    router.push('/')
  } catch {
    errorMessage.value = 'Could not login.'
  }
}
</script>

<template>
  <section>
    <h1>Login</h1>

    <p v-if="errorMessage">{{ errorMessage }}</p>

    <form @submit.prevent="login">
      <label>
        Email
        <input v-model="email" type="email" required />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required />
      </label>

      <button type="submit">Login</button>
    </form>
  </section>
</template>
