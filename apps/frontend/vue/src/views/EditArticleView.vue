<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'

type Article = {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  author: {
    username: string
  }
}

const route = useRoute()
const router = useRouter()
const { user, clearSession } = useAuth()

const article = ref<Article | null>(null)
const title = ref('')
const description = ref('')
const body = ref('')
const tags = ref('')
const errorMessage = ref('')

const loadArticle = async () => {
  try {
    const slug = route.params.slug?.toString()
    const response = await fetch(`/api/articles/${slug}`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not load article.')
      return
    }

    if (data.article.author.username !== user.value?.username) {
      router.replace(`/articles/${data.article.slug}`)
      return
    }

    article.value = data.article
    title.value = data.article.title
    description.value = data.article.description
    body.value = data.article.body
    tags.value = data.article.tagList.join(', ')
  } catch {
    errorMessage.value = 'Could not load article.'
  }
}

const updateArticle = async () => {
  if (!article.value || !user.value) return

  errorMessage.value = ''

  if (article.value.author.username !== user.value.username) {
    errorMessage.value = 'You can only edit your own articles.'
    return
  }

  if (!title.value || !description.value || !body.value) {
    errorMessage.value = 'Title, description and body are required.'
    return
  }

  const tagList = tags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  try {
    const response = await fetch(`/api/articles/${article.value.slug}`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${user.value.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: title.value,
          description: description.value,
          body: body.value,
          tagList,
        },
      }),
    })

    if (response.status === 401) {
      clearSession()
      return
    }

    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = describeError(response.status, data, 'Could not update article.')
      return
    }

    router.push(`/articles/${data.article.slug}`)
  } catch {
    errorMessage.value = 'Could not update article.'
  }
}

const deleteArticle = async () => {
  if (!article.value || !user.value) return

  errorMessage.value = ''

  if (article.value.author.username !== user.value.username) {
    errorMessage.value = 'You can only delete your own articles.'
    return
  }

  try {
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

    if (response.status === 401) {
      clearSession()
      return
    }

    const data = await response.json()
    errorMessage.value = describeError(response.status, data, 'Could not delete article.')
  } catch {
    errorMessage.value = 'Could not delete article.'
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<template>
  <section>
    <header class="page-head">
      <h1>Edit article</h1>
      <p class="page-head-sub">Update or remove your post.</p>
    </header>

    <div v-if="article" class="form-card">
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <form @submit.prevent="updateArticle">
        <label>
          Title
          <input v-model="title" required />
        </label>

        <label>
          Description
          <input v-model="description" required />
        </label>

        <label>
          Body
          <textarea v-model="body" rows="10" required></textarea>
        </label>

        <label>
          Tags
          <input v-model="tags" placeholder="vue, web, conduit" />
        </label>

        <div class="form-actions">
          <button type="submit">Update article</button>
          <button type="button" class="danger" @click="deleteArticle">Delete article</button>
        </div>
      </form>
    </div>

    <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </section>
</template>
