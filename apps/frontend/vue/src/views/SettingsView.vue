<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'

const router = useRouter()
const { user, isLoggedIn, setUser, logout, clearSession } = useAuth()

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

    if (response.status === 401) {
      clearSession()
      return
    }

    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not update settings.')
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
    <header class="page-head">
      <h1>Settings</h1>
      <p class="page-head-sub">Update your profile and account details.</p>
    </header>

    <p v-if="!isLoggedIn">
      Please <RouterLink to="/login">sign in</RouterLink> to change your settings.
    </p>

    <div v-else class="form-card">
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

      <form @submit.prevent="saveSettings">
        <label>
          Username
          <input v-model="username" autocomplete="username" required />
        </label>

        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <label>
          Bio
          <textarea v-model="bio" rows="4" placeholder="Tell readers about yourself"></textarea>
        </label>

        <label>
          Image URL
          <input v-model="image" placeholder="https://…" />
        </label>

        <label>
          New password
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Leave blank to keep current"
          />
        </label>

        <div class="form-actions">
          <button type="submit">Save settings</button>
          <button type="button" class="ghost" @click="logoutAndGoHome">Sign out</button>
        </div>
      </form>
    </div>
  </section>
</template>
