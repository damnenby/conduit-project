<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
          <h2>{{ article.title }}</h2>
          <p>by {{ article.author.username }}</p>
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
