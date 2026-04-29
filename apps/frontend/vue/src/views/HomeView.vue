<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Book = {
  id: number
  title: string
  year: number
  author: string
}

const books = ref<Book[]>([])

const fetchBooks = () => {
  fetch('/api/books')
    .then((response) => response.json())
    .then((data) => {
      books.value = data
    })
}

onMounted(() => {
  fetchBooks()
})

const createBook = async () => {
  const newBook: Omit<Book, 'id'> = {
    title: 'New book',
    author: 'Unknown',
    year: new Date().getFullYear(),
  }

  // send to backend/db
  fetch('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newBook),
  })
    .then((response) => response.json())
    .then(() => fetchBooks())
}
</script>

<template>
  <div>
    <h1>Books</h1>

    <ol>
      <li v-for="book in books" :key="book.id">{{ book.title }}</li>
    </ol>

    <button @click="createBook()">Add book</button>
  </div>
</template>
