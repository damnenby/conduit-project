<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type Article = {
  slug: string
  title: string
  description: string
  createdAt: string
  tagList: string[]
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

const canGoBack = computed(() => page.value > 0)
const canGoNext = computed(
  () => (page.value + 1) * pageSize < articlesCount.value,
)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchArticles = async (tag = selectedTag.value, nextPage = page.value) => {
  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: (nextPage * pageSize).toString(),
    })

    if (tag) params.set('tag', tag)

    const response = await fetch(`/api/articles?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load articles.'
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
    <h1>Conduit</h1>
    <p>A simple page for reading articles.</p>

    <p v-if="errorMessage">{{ errorMessage }}</p>

    <aside>
      <h2>Tags</h2>
      <button
        type="button"
        :class="{ active: !selectedTag }"
        @click="selectTag()"
      >
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
      <p v-if="selectedTag">Showing tag: {{ selectedTag }}</p>
    </aside>

    <p v-if="loading">Loading articles...</p>
    <p v-else-if="articles.length === 0">No articles yet.</p>

    <template v-else>
      <ul>
        <li v-for="article in articles" :key="article.slug">
          <article>
            <h2>
              <RouterLink :to="`/articles/${article.slug}`">
                {{ article.title }}
              </RouterLink>
            </h2>
            <p>
              by
              <RouterLink :to="`/profiles/${article.author.username}`">
                {{ article.author.username }}
              </RouterLink>
            </p>
            <p>Published: {{ formatDate(article.createdAt) }}</p>
            <p>{{ article.description }}</p>
            <p>Likes: {{ article.favoritesCount }}</p>

            <ul>
              <li v-for="tag in article.tagList" :key="tag">
                {{ tag }}
              </li>
            </ul>
          </article>
        </li>
      </ul>

      <nav aria-label="Article pages">
        <button
          type="button"
          :disabled="!canGoBack"
          @click="fetchArticles(selectedTag, page - 1)"
        >
          Previous
        </button>
        <span>Page {{ page + 1 }}</span>
        <button
          type="button"
          :disabled="!canGoNext"
          @click="fetchArticles(selectedTag, page + 1)"
        >
          Next
        </button>
      </nav>
    </template>
  </section>
</template>
