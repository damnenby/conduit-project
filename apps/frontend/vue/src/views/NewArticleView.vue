<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { describeError } from '../composables/useApi'

const router = useRouter()
const { user, clearSession } = useAuth()

const title = ref('')
const description = ref('')
const body = ref('')
const tags = ref('')
const errorMessage = ref('')

const createArticle = async () => {
  if (!user.value) return

  errorMessage.value = ''

  if (!title.value || !description.value || !body.value) {
    errorMessage.value = 'Title, description and body are required.'
    return
  }

  const tagList = tags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  try {
    const response = await fetch('/api/articles', {
      method: 'POST',
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
      errorMessage.value = describeError(response.status, data, 'Could not create article.')
      return
    }

    router.push(`/articles/${data.article.slug}`)
  } catch {
    errorMessage.value = 'Could not create article.'
  }
}
</script>

<template>
  <section>
    <header class="page-head">
      <h1>New article</h1>
      <p class="page-head-sub">Write and publish a new post.</p>
    </header>

    <div class="form-card">
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <form @submit.prevent="createArticle">
        <label>
          Title
          <input v-model="title" placeholder="Article title" required />
        </label>

        <label>
          Description
          <input v-model="description" placeholder="What is this article about?" required />
        </label>

        <label>
          Body
          <textarea v-model="body" rows="10" placeholder="Write your article…" required></textarea>
        </label>

        <label>
          Tags
          <input v-model="tags" placeholder="vue, web, conduit" />
        </label>

        <button type="submit">Publish article</button>
      </form>
    </div>
  </section>
</template>
