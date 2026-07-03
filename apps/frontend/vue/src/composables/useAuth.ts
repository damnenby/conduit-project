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
    // Invalid local data is treated as a signed-out session.
  }

  localStorage.removeItem(storageKey)
  return null
}

const user = ref<AuthUser | null>(readSavedUser())

// Set when a request is rejected with 401 and we clear a stale/expired token,
// so the app can show one calm "please sign in" notice instead of a raw banner.
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

  // Quietly drop an invalid login and flag that the session needs renewing.
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
          // A temporary backend failure should not destroy a valid local
          // session. The destination page can still show its normal error.
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
        // Keep the local session during a temporary network failure. Individual
        // pages still handle request errors and invalid tokens normally.
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
