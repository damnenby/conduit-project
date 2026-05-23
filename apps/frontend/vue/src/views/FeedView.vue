<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

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
const errorMessage = ref('')
const loading = ref(false)
const { user } = useAuth()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchFeed = async () => {
  if (!user.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/articles/feed', {
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
  } catch {
    errorMessage.value = 'Could not load feed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFeed()
})
</script>

<template>
  <section>
    <h1>Feed</h1>
    <p>Articles from followed authors.</p>

    <p v-if="errorMessage">{{ errorMessage }}</p>
    <p v-if="loading">Loading feed...</p>
    <p v-else-if="articles.length === 0">No feed articles yet.</p>

    <ul v-else>
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
  </section>
</template>
