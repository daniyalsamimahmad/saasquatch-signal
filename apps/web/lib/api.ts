/**
 * Server-side client for the NestJS API. The JWT issued by the API rides in
 * the Auth.js session (never exposed to the browser); every server component
 * and server action goes through here.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:4000/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  searchParams?: Record<string, string | number | string[] | undefined>;
  revalidate?: number | false;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: Options = {},
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = Array.isArray(json?.message)
      ? json.message.join('; ')
      : (json?.message ?? `API error ${res.status}`);
    throw new ApiError(res.status, message);
  }
  return json as T;
}
