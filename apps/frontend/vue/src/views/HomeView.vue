<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type Article = {
  slug: string
  title: string
  description: string
  tagList: string[]
  favoritesCount: number
  author: {
    username: string
  }
}

const articles = ref<Article[]>([])
const errorMessage = ref('')

const fetchArticles = async () => {
  try {
    const response = await fetch('/api/articles')
    const data = await response.json()
    articles.value = data.articles
  } catch {
    errorMessage.value = 'Could not load articles.'
  }
}

onMounted(() => {
  fetchArticles()
})
</script>

<template>
  <section>
    <h1>Conduit</h1>
    <p>A simple page for reading articles.</p>

    <p v-if="errorMessage">{{ errorMessage }}</p>

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
