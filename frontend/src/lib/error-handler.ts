export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.message === 'SESSION_EXPIRED') {
      return new ApiError('Session expired. Please log in again.', 401);
    }
    return new ApiError(error.message, 500);
  }

  return new ApiError('An unexpected error occurred', 500);
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}
