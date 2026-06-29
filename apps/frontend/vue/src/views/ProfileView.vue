<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'
import EmptyState from '../components/EmptyState.vue'

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
const { user, clearSession } = useAuth()
const profile = ref<Profile | null>(null)
const articles = ref<Article[]>([])
const errorMessage = ref('')
const loadingArticles = ref(false)
const activeTab = ref<'articles' | 'favorited'>('articles')

const isOwnProfile = computed(() => user.value?.username === profile.value?.username)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const emptyTitle = computed(() =>
  activeTab.value === 'articles' ? 'No articles yet' : 'No favorited articles yet',
)

const emptyMessage = computed(() =>
  activeTab.value === 'articles'
    ? `${profile.value?.username ?? 'This author'} has not published anything yet.`
    : `${profile.value?.username ?? 'This author'} has not favorited anything yet.`,
)

const fetchProfile = async () => {
  errorMessage.value = ''

  try {
    const username = route.params.username?.toString()
    if (!username) return

    const headers = user.value ? { Authorization: `Token ${user.value.token}` } : undefined
    const response = await fetch(`/api/profiles/${username}`, { headers })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not load profile.')
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
      errorMessage.value = describeError(response.status, data, 'Could not load articles.')
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
    errorMessage.value = 'Please sign in to follow authors.'
    return
  }

  const method = profile.value.following ? 'DELETE' : 'POST'
  const response = await fetch(`/api/profiles/${profile.value.username}/follow`, {
    method,
    headers: {
      Authorization: `Token ${user.value.token}`,
    },
  })

  if (response.status === 401) {
    clearSession()
    return
  }

  const data = await response.json()

  if (response.ok) {
    profile.value = data.profile
    errorMessage.value = ''
  } else {
    errorMessage.value = describeError(response.status, data, 'Could not update follow.')
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

    <header v-if="profile" class="profile-head">
      <h1>{{ profile.username }}</h1>
      <p class="profile-bio">{{ profile.bio ?? 'No bio yet.' }}</p>
      <button v-if="!isOwnProfile" type="button" class="ghost" @click="toggleFollow">
        {{ profile.following ? 'Unfollow' : 'Follow' }}
      </button>
      <RouterLink v-else to="/settings" class="read-more">Edit profile</RouterLink>
    </header>

    <section>
      <div class="profile-tabs" role="tablist" aria-label="Profile articles">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'articles'"
          :class="{ active: activeTab === 'articles' }"
          @click="selectTab('articles')"
        >
          Articles
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'favorited'"
          :class="{ active: activeTab === 'favorited' }"
          @click="selectTab('favorited')"
        >
          Favorited
        </button>
      </div>

      <p v-if="loadingArticles" class="loading-note">Loading articles…</p>

      <EmptyState v-else-if="articles.length === 0" :title="emptyTitle" :message="emptyMessage" />

      <ul v-else class="article-list">
        <li v-for="article in articles" :key="article.slug">
          <article>
            <p class="article-byline">
              <time class="article-date" :datetime="article.createdAt">
                {{ formatDate(article.createdAt) }}
              </time>
              <span class="article-date">· {{ article.favoritesCount }} favorites</span>
            </p>
            <h3 class="article-title">
              <RouterLink :to="`/articles/${article.slug}`">{{ article.title }}</RouterLink>
            </h3>
            <p class="article-excerpt">{{ article.description }}</p>
            <RouterLink :to="`/articles/${article.slug}`" class="read-more">Read more</RouterLink>
          </article>
        </li>
      </ul>
    </section>
  </section>
</template>
