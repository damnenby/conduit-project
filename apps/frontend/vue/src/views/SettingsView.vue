<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user, isLoggedIn, setUser, logout } = useAuth()

const username = ref('')
const email = ref('')
const password = ref('')
const bio = ref('')
const image = ref('')
const errorMessage = ref('')
const successMessage = ref('')

watch(
  user,
  (currentUser) => {
    username.value = currentUser?.username ?? ''
    email.value = currentUser?.email ?? ''
    bio.value = currentUser?.bio ?? ''
    image.value = currentUser?.image ?? ''
    password.value = ''
  },
  { immediate: true },
)

const saveSettings = async () => {
  if (!user.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (password.value && password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }

  const updateData: {
    username: string
    email: string
    bio: string
    image: string
    password?: string
  } = {
    username: username.value,
    email: email.value,
    bio: bio.value,
    image: image.value,
  }

  if (password.value) {
    updateData.password = password.value
  }

  try {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        Authorization: `Token ${user.value.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: updateData }),
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not update settings.'
      return
    }

    setUser(data.user)
    successMessage.value = 'Settings saved.'
  } catch {
    errorMessage.value = 'Could not update settings.'
  }
}

const logoutAndGoHome = () => {
  logout()
  router.push('/')
}
</script>

<template>
  <section>
    <h1>Settings</h1>

    <p v-if="!isLoggedIn">
      Please <RouterLink to="/login">login</RouterLink> to change your settings.
    </p>

    <form v-else @submit.prevent="saveSettings">
      <p v-if="errorMessage">{{ errorMessage }}</p>
      <p v-if="successMessage">{{ successMessage }}</p>

      <label>
        Username
        <input v-model="username" required />
      </label>

      <label>
        Email
        <input v-model="email" type="email" required />
      </label>

      <label>
        Bio
        <textarea v-model="bio" rows="4"></textarea>
      </label>

      <label>
        Image URL
        <input v-model="image" />
      </label>

      <label>
        New password
        <input v-model="password" type="password" />
      </label>

      <button type="submit">Save settings</button>
      <button type="button" @click="logoutAndGoHome">Logout</button>
    </form>
  </section>
</template>
