<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

type Article = {
  slug: string
  title: string
  description: string
  body: string
  createdAt: string
  updatedAt: string
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
  createdAt: string
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
const newComment = ref('')

const isOwnArticle = computed(() => {
  return article.value?.author.username === user.value?.username
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const fetchArticle = async () => {
  try {
    const slug = route.params.slug?.toString()
    const headers = user.value ? { Authorization: `Token ${user.value.token}` } : undefined
    const response = await fetch(`/api/articles/${slug}`, { headers })
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

const postComment = async () => {
  if (!article.value || !user.value) return

  const commentBody = newComment.value.trim()

  if (!commentBody) {
    errorMessage.value = 'Comment body is required.'
    return
  }

  try {
    const response = await fetch(`/api/articles/${article.value.slug}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${user.value.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: {
          body: commentBody,
        },
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not post comment.'
      return
    }

    comments.value = [data.comment, ...comments.value]
    newComment.value = ''
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Could not post comment.'
  }
}

const deleteComment = async (commentId: number) => {
  if (!article.value || !user.value) return

  const response = await fetch(
    `/api/articles/${article.value.slug}/comments/${commentId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${user.value.token}`,
      },
    },
  )

  if (response.ok) {
    comments.value = comments.value.filter((comment) => comment.id !== commentId)
    errorMessage.value = ''
    return
  }

  const data = await response.json()
  errorMessage.value = data.errors?.body?.[0] ?? 'Could not delete comment.'
}

onMounted(() => {
  fetchArticle()
  fetchComments()
})
</script>

<template>
  <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

  <article v-if="article">
    <h1>{{ article.title }}</h1>
    <p class="article-meta">
      by
      <RouterLink :to="`/profiles/${article.author.username}`">
        {{ article.author.username }}
      </RouterLink>
      &middot; {{ formatDate(article.createdAt) }}
    </p>
    <p>{{ article.description }}</p>

    <p class="article-body">{{ article.body }}</p>

    <ul class="tag-list">
      <li v-for="tag in article.tagList" :key="tag">
        {{ tag }}
      </li>
    </ul>

    <div class="article-actions">
      <button @click="toggleFavorite">
        {{ article.favorited ? 'Unfavorite' : 'Favorite' }} ({{ article.favoritesCount }})
      </button>
      <RouterLink v-if="isOwnArticle" :to="`/editor/${article.slug}`">
        Edit article
      </RouterLink>
      <button v-if="isOwnArticle" class="danger" @click="deleteArticle">Delete article</button>
    </div>
  </article>

  <section>
    <h2>Comments</h2>

    <form v-if="user" @submit.prevent="postComment">
      <label>
        Add comment
        <textarea v-model="newComment" rows="4"></textarea>
      </label>
      <button type="submit">Post comment</button>
    </form>

    <p v-else>
      <RouterLink to="/login">Login</RouterLink> to comment.
    </p>

    <ul class="comment-list">
      <li v-for="comment in comments" :key="comment.id">
        <p>{{ comment.body }}</p>
        <div class="comment-footer">
          <span class="article-meta">
            <RouterLink :to="`/profiles/${comment.author.username}`">
              {{ comment.author.username }}
            </RouterLink>
            &middot; {{ formatDate(comment.createdAt) }}
          </span>
          <button
            v-if="comment.author.username === user?.username"
            class="ghost"
            @click="deleteComment(comment.id)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
