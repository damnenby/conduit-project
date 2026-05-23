<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchArticles = async (tag = '') => {
  try {
    const url = tag ? `/api/articles?tag=${encodeURIComponent(tag)}` : '/api/articles'
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load articles.'
      return
    }

    articles.value = data.articles
    selectedTag.value = tag
  } catch {
    errorMessage.value = 'Could not load articles.'
  }
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
      <button type="button" @click="fetchArticles()">All</button>
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        @click="fetchArticles(tag)"
      >
        {{ tag }}
      </button>
      <p v-if="selectedTag">Showing tag: {{ selectedTag }}</p>
    </aside>

    <p v-if="articles.length === 0">No articles yet.</p>

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
