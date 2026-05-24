<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

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
const { user } = useAuth()

const canGoBack = computed(() => page.value > 0)
const canGoNext = computed(() => (page.value + 1) * pageSize < articlesCount.value)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

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
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load feed.'
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
  const data = await response.json()

  if (!response.ok) {
    errorMessage.value = data.errors?.body?.[0] ?? 'Could not update favorite.'
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
    <h1>Feed</h1>
    <p>Articles from followed authors.</p>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="loading">Loading feed...</p>
    <p v-else-if="articles.length === 0">No feed articles yet.</p>

    <template v-else>
      <ul class="article-list">
        <li v-for="article in articles" :key="article.slug">
          <article>
            <h2>
              <RouterLink :to="`/articles/${article.slug}`">
                {{ article.title }}
              </RouterLink>
            </h2>
            <p class="article-meta">
              by
              <RouterLink :to="`/profiles/${article.author.username}`">
                {{ article.author.username }}
              </RouterLink>
              &middot; {{ formatDate(article.createdAt) }} &middot;
              {{ article.favoritesCount }} likes
            </p>
            <p>{{ article.description }}</p>
            <ul class="tag-list">
              <li v-for="tag in article.tagList" :key="tag">
                {{ tag }}
              </li>
            </ul>
            <div class="article-actions">
              <button type="button" class="ghost" @click="toggleFavorite(article)">
                {{ article.favorited ? 'Unfavorite' : 'Favorite' }}
                ({{ article.favoritesCount }})
              </button>
            </div>
          </article>
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
