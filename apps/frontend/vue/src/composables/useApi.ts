/**
 * Small helpers for talking to the `/api` backend consistently.
 *
 * The backend returns errors as `{ errors: { body: [message, ...] } }`.
 * `describeError` turns a response status + parsed body into a single,
 * user-friendly message so every view shows the same calm wording.
 *
 * 401 is handled separately by the views: they call `clearSession()` from
 * `useAuth`, which signs the stale token out and shows one global notice
 * instead of leaving a raw "Authorization token is invalid" banner.
 */

type ApiErrorBody = {
  errors?: {
    body?: string[]
  }
}

export const describeError = (
  status: number,
  data: ApiErrorBody | null,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (status === 403) {
    return 'You do not have permission to do that.'
  }

  const message = data?.errors?.body?.[0]
  return message ?? fallback
}
