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

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : undefined

  if (!res.ok) {
    const message = (body && (body.error as string)) || res.statusText
    throw new ApiError(res.status, message)
  }

  return body as T
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  return handleResponse<T>(res)
}

/** Like `request`, but sends a multipart body (e.g. image upload) — no Content-Type
 *  header, so the browser sets it with the correct multipart boundary itself. */
async function requestForm<T>(path: string, formData: FormData, method: string): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: formData })
  return handleResponse<T>(res)
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

  getMe: () => request<User>('/users/me'),

  updateProfile: (email: string, displayName: string) =>
    request<{ token: string; user: User }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ email, displayName }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: (password: string) =>
    request<void>('/users/me', { method: 'DELETE', body: JSON.stringify({ password }) }),

  uploadProfileImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return requestForm<User>('/users/me/image', form, 'POST')
  },

  deleteProfileImage: () => request<User>('/users/me/image', { method: 'DELETE' }),

  getTopics: (search?: string) =>
    request<Topic[]>(`/topics${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getTopic: (id: string) => request<Topic>(`/topics/${id}`),

  createTopic: (name: string, description?: string) =>
    request<Topic>('/topics', { method: 'POST', body: JSON.stringify({ name, description }) }),

  updateTopic: (id: string, name: string, description?: string) =>
    request<Topic>(`/topics/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),

  deleteTopic: (id: string) => request<void>(`/topics/${id}`, { method: 'DELETE' }),

  uploadTopicImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return requestForm<Topic>(`/topics/${id}/image`, form, 'POST')
  },

  deleteTopicImage: (id: string) => request<Topic>(`/topics/${id}/image`, { method: 'DELETE' }),

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

  uploadEntityImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return requestForm<Entity>(`/entities/${id}/image`, form, 'POST')
  },

  deleteEntityImage: (id: string) => request<Entity>(`/entities/${id}/image`, { method: 'DELETE' }),

  upsertRating: (entityId: string, score: number, comment?: string) =>
    request<Entity>(`/entities/${entityId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ score, comment }),
    }),

  deleteRating: (entityId: string) => request<Entity>(`/entities/${entityId}/rating`, { method: 'DELETE' }),

  getListsByTopic: (topicId: string) => request<ListSummary[]>(`/topics/${topicId}/lists`),

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
