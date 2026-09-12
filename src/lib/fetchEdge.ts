const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function isSupabaseConfigured(): boolean {
  return Boolean(BASE_URL);
}

export function edgeFunctionUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('Server is not configured yet. Please try again later.');
  }
  return `${BASE_URL}/functions/v1/${path}`;
}

export async function fetchEdgeJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = edgeFunctionUrl(path);
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('The server returned an unexpected response. Please try again later.');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Something went wrong.');
  }
  return data as T;
}
