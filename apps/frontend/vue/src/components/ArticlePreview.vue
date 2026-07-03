<script setup lang="ts">
import { RouterLink } from 'vue-router'

type Article = {
  slug: string
  title: string
  description: string
  createdAt: string
  tagList: string[]
  favorited: boolean
  favoritesCount: number
  author: {
    username: string
  }
}

defineProps<{
  article: Article
}>()

defineEmits<{
  (e: 'toggle-favorite', article: Article): void
}>()

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
</script>

<template>
  <article class="article-preview">
    <div class="article-preview-head">
      <p class="article-byline">
        <RouterLink :to="`/profiles/${article.author.username}`" class="article-author">
          {{ article.author.username }}
        </RouterLink>
        <time class="article-date" :datetime="article.createdAt">
          {{ formatDate(article.createdAt) }}
        </time>
      </p>
      <button
        type="button"
        class="favorite-button"
        :class="{ 'is-favorited': article.favorited }"
        :aria-pressed="article.favorited"
        :aria-label="
          article.favorited
            ? `Unfavorite ${article.title}`
            : `Favorite ${article.title}`
        "
        @click="$emit('toggle-favorite', article)"
      >
        {{ article.favorited ? 'Favorited' : 'Favorite' }}
        <span class="favorite-count">{{ article.favoritesCount }}</span>
      </button>
    </div>

    <h2 class="article-title">
      <RouterLink :to="`/articles/${article.slug}`">{{ article.title }}</RouterLink>
    </h2>

    <p class="article-excerpt">{{ article.description }}</p>

    <div class="article-preview-foot">
      <ul v-if="article.tagList.length" class="tag-list">
        <li v-for="tag in article.tagList" :key="tag">{{ tag }}</li>
      </ul>
      <span v-else></span>
      <RouterLink :to="`/articles/${article.slug}`" class="read-more">
        Read more
      </RouterLink>
    </div>
  </article>
</template>
