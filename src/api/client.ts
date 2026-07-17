export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pte_token');
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const data = hasJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `HTTP error ${response.status}`);
  }

  return data as T;
}
