<script setup lang="ts">
defineProps<{
  title: string
  message?: string
}>()
</script>

<template>
  <div class="empty-state">
    <h2 class="empty-state-title">{{ title }}</h2>
    <p v-if="message" class="empty-state-message">{{ message }}</p>
    <div v-if="$slots.default" class="empty-state-actions">
      <slot />
    </div>
  </div>
</template>
