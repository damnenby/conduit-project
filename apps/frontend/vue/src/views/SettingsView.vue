<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'
import { notifyError, notifySuccess } from '../composables/useToast'
import UserAvatar from '../components/UserAvatar.vue'

const router = useRouter()
const { user, isLoggedIn, setUser, logout, clearSession } = useAuth()

const username = ref('')
const email = ref('')
const password = ref('')
const bio = ref('')
const image = ref('')

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

  if (password.value && password.value.length < 8) {
    notifyError('Password must be at least 8 characters.')
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
      notifyError(describeError(response.status, data, 'Could not update settings.'))
      return
    }

    setUser(data.user)
    notifySuccess('Settings saved.')
  } catch {
    notifyError('Could not update settings.')
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
      <form @submit.prevent="saveSettings">
        <div class="avatar-preview">
          <UserAvatar :image="image" :username="username || 'User'" size="large" />
          <div>
            <strong>Avatar preview</strong>
            <span>Paste an HTTP(S) image URL below, or use the initials fallback.</span>
          </div>
        </div>

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
          <input
            v-model="image"
            type="url"
            inputmode="url"
            autocomplete="url"
            placeholder="https://…"
          />
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
