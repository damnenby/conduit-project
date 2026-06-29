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
const tags = ref<string[]>([])
const selectedTag = ref('')
const errorMessage = ref('')
const loading = ref(false)
const articlesCount = ref(0)
const page = ref(0)
const pageSize = 10
const { user, isLoggedIn, clearSession } = useAuth()

const canGoBack = computed(() => page.value > 0)
const canGoNext = computed(() => (page.value + 1) * pageSize < articlesCount.value)

const fetchArticles = async (tag = selectedTag.value, nextPage = page.value) => {
  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: (nextPage * pageSize).toString(),
    })

    if (tag) params.set('tag', tag)

    const headers = user.value ? { Authorization: `Token ${user.value.token}` } : undefined
    const response = await fetch(`/api/articles?${params.toString()}`, {
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not load articles.')
      return
    }

    articles.value = data.articles
    articlesCount.value = data.articlesCount
    selectedTag.value = tag
    page.value = nextPage
  } catch {
    errorMessage.value = 'Could not load articles.'
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async (article: Article) => {
  if (!user.value) {
    errorMessage.value = 'Please sign in to favorite articles.'
    return
  }

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

const selectTag = (tag = '') => {
  fetchArticles(tag, 0)
}

const fetchTags = async () => {
  try {
    const response = await fetch('/api/tags')
    const data = await response.json()

    if (response.ok) {
      tags.value = data.tags
    }
  } catch {
    errorMessage.value = 'Could not load tags.'
  }
}

onMounted(() => {
  fetchArticles()
  fetchTags()
})
</script>

<template>
  <section>
    <header class="page-head page-head--with-action">
      <div>
        <h1>Conduit</h1>
        <p class="page-head-sub">A place to read and share articles.</p>
      </div>
      <RouterLink v-if="isLoggedIn" to="/editor" class="header-action">
        New article
      </RouterLink>
    </header>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <div class="home-layout">
      <div>
        <p v-if="loading" class="loading-note">Loading articles…</p>

        <template v-else-if="articles.length === 0">
          <EmptyState
            v-if="selectedTag"
            title="No articles with this tag"
            :message="`Nothing has been published under “${selectedTag}” yet.`"
          >
            <button type="button" class="ghost" @click="selectTag()">
              Show all articles
            </button>
          </EmptyState>
          <EmptyState
            v-else
            title="No articles yet"
            message="Once articles are published, they will show up here."
          >
            <RouterLink v-if="isLoggedIn" to="/editor" class="read-more">
              Write the first article
            </RouterLink>
          </EmptyState>
        </template>

        <template v-else>
          <ul class="article-list">
            <li v-for="article in articles" :key="article.slug">
              <ArticlePreview :article="article" @toggle-favorite="toggleFavorite" />
            </li>
          </ul>

          <nav aria-label="Article pages" class="pagination">
            <button
              type="button"
              class="ghost"
              :disabled="!canGoBack"
              @click="fetchArticles(selectedTag, page - 1)"
            >
              Previous
            </button>
            <span>Page {{ page + 1 }}</span>
            <button
              type="button"
              class="ghost"
              :disabled="!canGoNext"
              @click="fetchArticles(selectedTag, page + 1)"
            >
              Next
            </button>
          </nav>
        </template>
      </div>

      <aside class="tags-sidebar">
        <div class="tags-sidebar-inner">
          <h2>Popular tags</h2>
          <div v-if="tags.length" class="tag-filters">
            <button type="button" :class="{ active: !selectedTag }" @click="selectTag()">
              All
            </button>
            <button
              v-for="tag in tags"
              :key="tag"
              type="button"
              :class="{ active: selectedTag === tag }"
              @click="selectTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <p v-else class="tags-empty">No tags yet.</p>
          <p v-if="selectedTag" class="tags-active-note">
            Filtering by “{{ selectedTag }}”.
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>
