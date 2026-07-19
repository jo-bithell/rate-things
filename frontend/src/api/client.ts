import type { Entity, ListSummary, Topic, User } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_KEY = 'ratethings_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : undefined

  if (!res.ok) {
    const message = (body && (body.error as string)) || res.statusText
    throw new ApiError(res.status, message)
  }

  return body as T
}

export const api = {
  register: (email: string, password: string, displayName: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getTopics: (search?: string) =>
    request<Topic[]>(`/topics${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getTopic: (id: string) => request<Topic>(`/topics/${id}`),

  createTopic: (name: string, description?: string) =>
    request<Topic>('/topics', { method: 'POST', body: JSON.stringify({ name, description }) }),

  updateTopic: (id: string, name: string, description?: string) =>
    request<Topic>(`/topics/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),

  deleteTopic: (id: string) => request<void>(`/topics/${id}`, { method: 'DELETE' }),

  getEntities: (topicId: string, search?: string, tag?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tag) params.set('tag', tag)
    const qs = params.toString()
    return request<Entity[]>(`/topics/${topicId}/entities${qs ? `?${qs}` : ''}`)
  },

  getEntity: (id: string) => request<Entity>(`/entities/${id}`),

  getEntityTags: (topicId: string) => request<string[]>(`/topics/${topicId}/entities/tags`),

  createEntity: (topicId: string, name: string, description?: string, tags?: string[]) =>
    request<Entity>(`/topics/${topicId}/entities`, {
      method: 'POST',
      body: JSON.stringify({ name, description, tags }),
    }),

  updateEntity: (id: string, name: string, description?: string, tags?: string[]) =>
    request<Entity>(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, tags }),
    }),

  deleteEntity: (id: string) => request<void>(`/entities/${id}`, { method: 'DELETE' }),

  upsertRating: (entityId: string, score: number, comment?: string) =>
    request<Entity>(`/entities/${entityId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ score, comment }),
    }),

  deleteRating: (entityId: string) => request<Entity>(`/entities/${entityId}/rating`, { method: 'DELETE' }),

  getListsByTopic: (topicId: string) => request<ListSummary[]>(`/topics/${topicId}/lists`),

  getMyLists: () => request<ListSummary[]>('/lists/mine'),

  getList: (id: string) => request<ListSummary>(`/lists/${id}`),

  createList: (topicId: string, name: string, description?: string) =>
    request<ListSummary>('/lists', { method: 'POST', body: JSON.stringify({ topicId, name, description }) }),

  updateList: (id: string, name: string, description?: string) =>
    request<ListSummary>(`/lists/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),

  replaceListEntries: (id: string, entityIdsInOrder: string[]) =>
    request<ListSummary>(`/lists/${id}/entries`, {
      method: 'PUT',
      body: JSON.stringify({ entityIdsInOrder }),
    }),

  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: 'DELETE' }),
}
