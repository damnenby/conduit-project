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
