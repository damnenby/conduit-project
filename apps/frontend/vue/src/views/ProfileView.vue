<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

type Profile = {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

const route = useRoute()
const profile = ref<Profile | null>(null)
const errorMessage = ref('')

const fetchProfile = async () => {
  try {
    const username = route.params.username?.toString()
    const response = await fetch(`/api/profiles/${username}`)
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
    </div>
  </section>
</template>
