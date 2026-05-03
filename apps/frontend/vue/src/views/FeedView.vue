<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

type Article = {
  slug: string
  title: string
  description: string
  author: {
    username: string
  }
}

const articles = ref<Article[]>([])
const errorMessage = ref('')

const fetchFeed = async () => {
  try {
    const response = await fetch('/api/articles/feed')
    const data = await response.json()
    articles.value = data.articles
  } catch {
    errorMessage.value = 'Could not load feed.'
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
    <p v-if="articles.length === 0">No feed articles yet.</p>

    <ul>
      <li v-for="article in articles" :key="article.slug">
        <article>
          <h2>
            <RouterLink :to="`/articles/${article.slug}`">
              {{ article.title }}
            </RouterLink>
          </h2>
          <p>by {{ article.author.username }}</p>
          <p>{{ article.description }}</p>
        </article>
      </li>
    </ul>
  </section>
</template>
