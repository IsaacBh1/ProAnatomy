import { HttpError } from './errors'

async function request(url: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new HttpError(response.status, url)
  return response
}

export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await request(url, signal)
  return response.json() as Promise<T>
}

export async function fetchBuffer(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await request(url, signal)
  return response.arrayBuffer()
}
