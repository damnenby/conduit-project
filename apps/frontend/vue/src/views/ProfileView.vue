<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

type Profile = {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

type Article = {
  slug: string
  title: string
  description: string
  createdAt: string
  favoritesCount: number
}

const route = useRoute()
const { user } = useAuth()
const profile = ref<Profile | null>(null)
const articles = ref<Article[]>([])
const errorMessage = ref('')

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchProfile = async () => {
  try {
    const username = route.params.username?.toString()
    if (!username) return

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

const fetchArticles = async () => {
  try {
    const username = route.params.username?.toString()
    if (!username) return

    const response = await fetch(
      `/api/articles?author=${encodeURIComponent(username)}`,
    )
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load articles.'
      return
    }

    articles.value = data.articles
  } catch {
    errorMessage.value = 'Could not load articles.'
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
  fetchArticles()
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

    <section>
      <h2>Articles</h2>

      <p v-if="articles.length === 0">No articles yet.</p>

      <ul v-else>
        <li v-for="article in articles" :key="article.slug">
          <h3>
            <RouterLink :to="`/articles/${article.slug}`">
              {{ article.title }}
            </RouterLink>
          </h3>
          <p>{{ article.description }}</p>
          <p>Published: {{ formatDate(article.createdAt) }}</p>
          <p>Likes: {{ article.favoritesCount }}</p>
        </li>
      </ul>
    </section>
  </section>
</template>
