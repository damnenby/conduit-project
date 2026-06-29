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

// Set when a request is rejected with 401 and we clear a stale/expired token,
// so the app can show one calm "please sign in" notice instead of a raw banner.
const sessionExpired = ref(false)

export const useAuth = () => {
  const isLoggedIn = computed(() => user.value !== null)

  const setUser = (nextUser: AuthUser) => {
    user.value = nextUser
    sessionExpired.value = false
    localStorage.setItem(storageKey, JSON.stringify(nextUser))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem(storageKey)
  }

  // Quietly drop an invalid login and flag that the session needs renewing.
  const clearSession = () => {
    if (user.value) {
      logout()
      sessionExpired.value = true
    }
  }

  const dismissSessionExpired = () => {
    sessionExpired.value = false
  }

  return {
    user,
    isLoggedIn,
    sessionExpired,
    setUser,
    logout,
    clearSession,
    dismissSessionExpired,
  }
}
