<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'
import ArticlePreview from '../components/ArticlePreview.vue'
import EmptyState from '../components/EmptyState.vue'

type Article = {
  slug: string
  title: string
  description: string
  createdAt: string
  tagList: string[]
  favorited: boolean
  favoritesCount: number
  author: {
    username: string
  }
}

const articles = ref<Article[]>([])
const errorMessage = ref('')
const loading = ref(false)
const articlesCount = ref(0)
const page = ref(0)
const pageSize = 10
const { user, isLoggedIn, clearSession } = useAuth()

const canGoBack = computed(() => page.value > 0)
const canGoNext = computed(() => (page.value + 1) * pageSize < articlesCount.value)

const fetchFeed = async (nextPage = page.value) => {
  if (!user.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: (nextPage * pageSize).toString(),
    })

    const response = await fetch(`/api/articles/feed?${params.toString()}`, {
      headers: {
        Authorization: `Token ${user.value.token}`,
      },
    })

    if (response.status === 401) {
      clearSession()
      return
    }

    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not load feed.')
      return
    }

    articles.value = data.articles
    articlesCount.value = data.articlesCount
    page.value = nextPage
  } catch {
    errorMessage.value = 'Could not load feed.'
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async (article: Article) => {
  if (!user.value) return

  const method = article.favorited ? 'DELETE' : 'POST'
  const response = await fetch(`/api/articles/${article.slug}/favorite`, {
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

  if (!response.ok) {
    errorMessage.value = describeError(response.status, data, 'Could not update favorite.')
    return
  }

  articles.value = articles.value.map((currentArticle) =>
    currentArticle.slug === data.article.slug ? data.article : currentArticle,
  )
  errorMessage.value = ''
}

onMounted(() => {
  fetchFeed()
})
</script>

<template>
  <section>
    <header class="page-head">
      <h1>Your feed</h1>
      <p class="page-head-sub">The latest from authors you follow.</p>
    </header>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <p v-if="loading" class="loading-note">Loading feed…</p>

    <EmptyState
      v-else-if="!isLoggedIn"
      title="Please sign in"
      message="Sign in again to see your feed."
    >
      <RouterLink to="/login" class="read-more">Sign in</RouterLink>
    </EmptyState>

    <EmptyState
      v-else-if="articles.length === 0"
      title="Your feed is empty"
      message="Follow some authors and their newest articles will appear here."
    >
      <RouterLink to="/" class="read-more">Browse all articles</RouterLink>
    </EmptyState>

    <template v-else>
      <ul class="article-list">
        <li v-for="article in articles" :key="article.slug">
          <ArticlePreview :article="article" @toggle-favorite="toggleFavorite" />
        </li>
      </ul>

      <nav aria-label="Feed pages" class="pagination">
        <button type="button" class="ghost" :disabled="!canGoBack" @click="fetchFeed(page - 1)">
          Previous
        </button>
        <span>Page {{ page + 1 }}</span>
        <button type="button" class="ghost" :disabled="!canGoNext" @click="fetchFeed(page + 1)">
          Next
        </button>
      </nav>
    </template>
  </section>
</template>
