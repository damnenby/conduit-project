<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

type Profile = {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

const route = useRoute()
const { user } = useAuth()
const profile = ref<Profile | null>(null)
const errorMessage = ref('')

const fetchProfile = async () => {
  try {
    const username = route.params.username?.toString()
    const headers = user.value ? { Authorization: `Token ${user.value.token}` } : undefined
    const response = await fetch(`/api/profiles/${username}`, { headers })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load profile.'
      return
    }

    profile.value = data.profile
  } catch {
    errorMessage.value = 'Could not load profile.'
  }
}

const toggleFollow = async () => {
  if (!profile.value) return

  if (!user.value) {
    errorMessage.value = 'Please login to follow authors.'
    return
  }

  const method = profile.value.following ? 'DELETE' : 'POST'
  const response = await fetch(`/api/profiles/${profile.value.username}/follow`, {
    method,
    headers: {
      Authorization: `Token ${user.value.token}`,
    },
  })
  const data = await response.json()

  if (response.ok) {
    profile.value = data.profile
    errorMessage.value = ''
  } else {
    errorMessage.value = data.errors?.body?.[0] ?? 'Could not update follow.'
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <section>
    <p v-if="errorMessage">{{ errorMessage }}</p>

    <div v-if="profile">
      <h1>{{ profile.username }}</h1>
      <p>{{ profile.bio ?? 'No bio yet.' }}</p>
      <p>Following: {{ profile.following ? 'yes' : 'no' }}</p>
      <button @click="toggleFollow">
        {{ profile.following ? 'Unfollow' : 'Follow' }}
      </button>
    </div>
  </section>
</template>
