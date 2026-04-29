<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

type Article = {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  favoritesCount: number
  author: {
    username: string
  }
}

type Comment = {
  id: number
  body: string
  author: {
    username: string
  }
}

const route = useRoute()
const article = ref<Article | null>(null)
const comments = ref<Comment[]>([])
const errorMessage = ref('')

const fetchArticle = async () => {
  try {
    const slug = route.params.slug?.toString()
    const response = await fetch(`/api/articles/${slug}`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not load article.'
      return
    }

    article.value = data.article
  } catch {
    errorMessage.value = 'Could not load article.'
  }
}

const fetchComments = async () => {
  try {
    const slug = route.params.slug?.toString()
    const response = await fetch(`/api/articles/${slug}/comments`)
    const data = await response.json()

    if (response.ok) {
      comments.value = data.comments
    }
  } catch {
    errorMessage.value = 'Could not load comments.'
  }
}

onMounted(() => {
  fetchArticle()
  fetchComments()
})
</script>

<template>
  <p v-if="errorMessage">{{ errorMessage }}</p>

  <article v-if="article">
    <h1>{{ article.title }}</h1>
    <p>by {{ article.author.username }}</p>
    <p>{{ article.description }}</p>

    <p>{{ article.body }}</p>

    <p>Likes: {{ article.favoritesCount }}</p>

    <ul>
      <li v-for="tag in article.tagList" :key="tag">
        {{ tag }}
      </li>
    </ul>
  </article>

  <section>
    <h2>Comments</h2>

    <ul>
      <li v-for="comment in comments" :key="comment.id">
        <p>{{ comment.body }}</p>
        <p>by {{ comment.author.username }}</p>
      </li>
    </ul>
  </section>
</template>
