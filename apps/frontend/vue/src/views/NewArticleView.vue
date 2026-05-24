<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user } = useAuth()

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
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.errors?.body?.[0] ?? 'Could not create article.'
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
    <h1>New Article</h1>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <form @submit.prevent="createArticle">
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
        <textarea v-model="body" rows="8" required></textarea>
      </label>

      <label>
        Tags
        <input v-model="tags" placeholder="vue, web, conduit" />
      </label>

      <button type="submit">Publish article</button>
    </form>
  </section>
</template>
