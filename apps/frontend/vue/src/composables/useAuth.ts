import { computed, ref } from 'vue'

type AuthUser = {
  email: string
  token: string
  username: string
  bio: string | null
  image: string | null
}

const storageKey = 'conduit_user'
const savedUser = localStorage.getItem(storageKey)

const user = ref<AuthUser | null>(savedUser ? JSON.parse(savedUser) : null)

export const useAuth = () => {
  const isLoggedIn = computed(() => user.value !== null)

  const setUser = (nextUser: AuthUser) => {
    user.value = nextUser
    localStorage.setItem(storageKey, JSON.stringify(nextUser))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem(storageKey)
  }

  return {
    user,
    isLoggedIn,
    setUser,
    logout,
  }
}
