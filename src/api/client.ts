export class ApiClientError extends Error {
  constructor(
    public httpStatus: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pte_token');
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Prefer cookie-based auth (httpOnly SameSite=Strict cookie set by server).
  // Fall back to Bearer token for backward compatibility.
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const data = hasJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (data && data.success === false && data.error) {
      throw new ApiClientError(
        response.status,
        data.error.code || 'UNKNOWN_ERROR',
        data.error.message || `HTTP error ${response.status}`,
        data.error.details,
      );
    }
    throw new ApiClientError(
      response.status,
      'HTTP_ERROR',
      data?.error || data?.message || `HTTP error ${response.status}`,
    );
  }

  // Unwrap success data wrapper
  if (data && data.success === true && data.data !== undefined) {
    return data.data as T;
  }

  return data as T;
}
