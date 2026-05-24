<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
const loadingArticles = ref(false)
const activeTab = ref<'articles' | 'favorited'>('articles')

const articleHeading = computed(() => {
  return activeTab.value === 'articles' ? 'Articles' : 'Favorited articles'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchProfile = async () => {
  errorMessage.value = ''

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
  loadingArticles.value = true
  errorMessage.value = ''

  try {
    const username = route.params.username?.toString()
    if (!username) return

    const params = new URLSearchParams()
    params.set(activeTab.value === 'articles' ? 'author' : 'favorited', username)

    const response = await fetch(`/api/articles?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load articles.'
      return
    }

    articles.value = data.articles
  } catch {
    errorMessage.value = 'Could not load articles.'
  } finally {
    loadingArticles.value = false
  }
}

const selectTab = (tab: 'articles' | 'favorited') => {
  activeTab.value = tab
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

watch(activeTab, () => {
  fetchArticles()
})

watch(
  () => route.params.username,
  () => {
    activeTab.value = 'articles'
    fetchProfile()
    fetchArticles()
  },
)
</script>

<template>
  <section>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <div v-if="profile">
      <h1>{{ profile.username }}</h1>
      <p>{{ profile.bio ?? 'No bio yet.' }}</p>
      <button v-if="user?.username !== profile.username" @click="toggleFollow">
        {{ profile.following ? 'Unfollow' : 'Follow' }}
      </button>
    </div>

    <section>
      <div class="profile-tabs">
        <button
          type="button"
          :class="{ active: activeTab === 'articles' }"
          @click="selectTab('articles')"
        >
          Articles
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'favorited' }"
          @click="selectTab('favorited')"
        >
          Favorited
        </button>
      </div>

      <h2>{{ articleHeading }}</h2>

      <p v-if="loadingArticles">Loading articles...</p>
      <p v-else-if="articles.length === 0">No articles yet.</p>

      <ul v-else class="article-list">
        <li v-for="article in articles" :key="article.slug">
          <h3>
            <RouterLink :to="`/articles/${article.slug}`">
              {{ article.title }}
            </RouterLink>
          </h3>
          <p class="article-meta">
            {{ formatDate(article.createdAt) }} &middot; {{ article.favoritesCount }} likes
          </p>
          <p>{{ article.description }}</p>
        </li>
      </ul>
    </section>
  </section>
</template>
