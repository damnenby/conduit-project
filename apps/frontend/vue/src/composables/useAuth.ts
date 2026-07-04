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

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<AuthUser>
  return (
    typeof candidate.email === 'string' &&
    typeof candidate.token === 'string' &&
    typeof candidate.username === 'string' &&
    (candidate.bio === null || typeof candidate.bio === 'string') &&
    (candidate.image === null || typeof candidate.image === 'string')
  )
}

const readSavedUser = (): AuthUser | null => {
  if (!savedUser) return null

  try {
    const parsed: unknown = JSON.parse(savedUser)
    if (isAuthUser(parsed)) return parsed
  } catch {
    // Ignore malformed stored sessions.
  }

  localStorage.removeItem(storageKey)
  return null
}

const user = ref<AuthUser | null>(readSavedUser())

// Controls the global expired-session notice.
const sessionExpired = ref(false)
const expiredUsername = ref<string | null>(null)
let sessionValidated = user.value === null
let validationPromise: Promise<boolean> | null = null

export const useAuth = () => {
  const isLoggedIn = computed(() => user.value !== null)

  const setUser = (nextUser: AuthUser) => {
    user.value = nextUser
    sessionExpired.value = false
    expiredUsername.value = null
    sessionValidated = true
    localStorage.setItem(storageKey, JSON.stringify(nextUser))
  }

  const logout = () => {
    user.value = null
    expiredUsername.value = null
    sessionValidated = true
    localStorage.removeItem(storageKey)
  }

  const clearSession = () => {
    if (user.value) {
      const username = user.value.username
      logout()
      expiredUsername.value = username
      sessionExpired.value = true
    }
  }

  const dismissSessionExpired = () => {
    sessionExpired.value = false
    expiredUsername.value = null
  }

  const wasExpiredUser = (username: string) => {
    return expiredUsername.value === username
  }

  const validateSession = async () => {
    if (!user.value || sessionValidated) return true
    if (validationPromise) return validationPromise

    const savedIdentity = user.value

    validationPromise = (async () => {
      try {
        const response = await fetch('/api/user', {
          headers: {
            Authorization: `Token ${savedIdentity.token}`,
          },
        })

        if (response.status === 401 || response.status === 404) {
          clearSession()
          return false
        }

        if (!response.ok) {
          // Keep the session when the backend is temporarily unavailable.
          return true
        }

        const data: unknown = await response.json()
        const currentUser =
          data && typeof data === 'object' && 'user' in data
            ? (data as { user: unknown }).user
            : null

        if (
          !isAuthUser(currentUser) ||
          currentUser.username !== savedIdentity.username ||
          currentUser.email !== savedIdentity.email
        ) {
          clearSession()
          return false
        }

        if (user.value?.token === savedIdentity.token) {
          setUser(currentUser)
        }
        return true
      } catch {
        // Keep the session during a temporary network failure.
        return true
      } finally {
        sessionValidated = true
        validationPromise = null
      }
    })()

    return validationPromise
  }

  return {
    user,
    isLoggedIn,
    sessionExpired,
    setUser,
    logout,
    clearSession,
    dismissSessionExpired,
    wasExpiredUser,
    validateSession,
  }
}
