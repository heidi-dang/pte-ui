export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pte_token');
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

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
