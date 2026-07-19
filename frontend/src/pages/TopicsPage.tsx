import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Topic } from '../types'
import ErrorBanner from '../components/ErrorBanner'

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async (search?: string) => {
    setLoading(true)
    try {
      setTopics(await api.getTopics(search))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load topics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await api.createTopic(newName.trim(), newDescription.trim() || undefined)
      setNewName('')
      setNewDescription('')
      setShowCreate(false)
      load(search)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create topic.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Topics</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ New topic'}
        </button>
      </div>

      <ErrorBanner message={error} />

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
          <input
            placeholder="Topic name (e.g. Movies)"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create topic'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="mb-4">
        <input
          placeholder="Search topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </form>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : topics.length === 0 ? (
        <p className="text-slate-500 text-sm">No topics yet. Create the first one.</p>
      ) : (
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.id}>
              <Link
                to={`/topics/${t.id}`}
                className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-400"
              >
                <div className="font-semibold">{t.name}</div>
                {t.description && <div className="text-sm text-slate-500">{t.description}</div>}
                <div className="text-xs text-slate-400 mt-1">Started by {t.createdByName}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
