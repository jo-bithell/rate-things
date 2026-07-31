import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Topic } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import ImagePicker from '../components/ImagePicker'

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [newIsPrivate, setNewIsPrivate] = useState(false)
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
    if (!newName.trim() || creating) return
    setCreating(true)
    setError(null)
    try {
      const created = await api.createTopic(newName.trim(), newDescription.trim() || undefined, newIsPrivate)
      if (newImage) {
        try {
          await api.uploadTopicImage(created.id, newImage)
        } catch (err) {
          setError(err instanceof ApiError ? `Topic created, but the image failed to upload: ${err.message}` : 'Topic created, but the image failed to upload.')
        }
      }
      setNewName('')
      setNewDescription('')
      setNewImage(null)
      setNewIsPrivate(false)
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
        <h1 className="text-2xl font-display font-bold">Topics</h1>
        <button onClick={() => setShowCreate((v) => !v)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ New topic'}
        </button>
      </div>

      <ErrorBanner message={error} />

      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-4 space-y-3">
          <input
            placeholder="Topic name (e.g. Movies)"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input-field"
          />
          <input
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="input-field"
          />
          <ImagePicker file={newImage} onChange={setNewImage} />
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={newIsPrivate}
              onChange={(e) => setNewIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-stone-900 accent-fuchsia-500"
            />
            Private (only you can see this topic)
          </label>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create topic'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="mb-4">
        <input
          placeholder="Search topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : topics.length === 0 ? (
        <p className="text-stone-500 text-sm">No topics yet. Create the first one.</p>
      ) : (
        <ul className="space-y-3">
          {topics.map((t) => (
            <li key={t.id}>
              <Link to={`/topics/${t.id}`} className="card-link flex items-center gap-3">
                {t.imageUrl && (
                  <img src={t.imageUrl} alt="" className="w-12 h-12 rounded-xl border-2 border-stone-900 object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold truncate">{t.name}</div>
                    {t.isPrivate && <span className="pill-tag shrink-0">🔒 Private</span>}
                  </div>
                  {t.description && <div className="text-sm text-stone-500">{t.description}</div>}
                  <div className="text-xs text-stone-400 mt-1">Started by {t.createdByName}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
