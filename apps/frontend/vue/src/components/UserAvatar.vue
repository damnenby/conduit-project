<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    image?: string | null
    username: string
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    image: null,
    size: 'medium',
  },
)

const imageFailed = ref(false)
const pixelSize = computed(() => ({ small: 28, medium: 42, large: 88 })[props.size])

const initials = computed(() => {
  const parts = props.username
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
})

const safeImageUrl = computed(() => {
  const value = props.image?.trim()
  if (!value || imageFailed.value) return null

  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
})

watch(
  () => props.image,
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <span class="user-avatar" :class="`user-avatar--${size}`" aria-hidden="true">
    <img
      v-if="safeImageUrl"
      :src="safeImageUrl"
      alt=""
      :width="pixelSize"
      :height="pixelSize"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="imageFailed = true"
    />
    <span v-else>{{ initials }}</span>
  </span>
</template>
