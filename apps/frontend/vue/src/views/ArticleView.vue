<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

type Article = {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  favorited: boolean
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
const router = useRouter()
const { user } = useAuth()
const article = ref<Article | null>(null)
const comments = ref<Comment[]>([])
const errorMessage = ref('')

const isOwnArticle = computed(() => {
  return article.value?.author.username === user.value?.username
})

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

const toggleFavorite = async () => {
  if (!article.value) return

  if (!user.value) {
    errorMessage.value = 'Please login to favorite articles.'
    return
  }

  const method = article.value.favorited ? 'DELETE' : 'POST'
  const response = await fetch(`/api/articles/${article.value.slug}/favorite`, {
    method,
    headers: {
      Authorization: `Token ${user.value.token}`,
    },
  })
  const data = await response.json()

  if (response.ok) {
    article.value = data.article
    errorMessage.value = ''
  } else {
    errorMessage.value = data.errors?.body?.[0] ?? 'Could not update favorite.'
  }
}

const deleteArticle = async () => {
  if (!article.value || !user.value) return

  const response = await fetch(`/api/articles/${article.value.slug}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Token ${user.value.token}`,
    },
  })

  if (response.ok) {
    router.push('/')
    return
  }

  const data = await response.json()
  errorMessage.value = data.errors?.body?.[0] ?? 'Could not delete article.'
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
    <button @click="toggleFavorite">
      {{ article.favorited ? 'Unfavorite' : 'Favorite' }}
    </button>

    <button v-if="isOwnArticle" @click="deleteArticle">Delete article</button>

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
