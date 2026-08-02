import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Topic } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import ImagePicker from '../components/ImagePicker'
import FriendPicker from '../components/FriendPicker'

type SortBy = 'updatedAt' | 'name'

const PAGE_SIZE = 20

export default function TopicsPage() {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
  const [createdByMeOnly, setCreatedByMeOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [newIsPrivate, setNewIsPrivate] = useState(false)
  const [newInvitedUserIds, setNewInvitedUserIds] = useState<string[]>([])
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

  const filteredSortedTopics = useMemo(() => {
    const filtered = createdByMeOnly ? topics.filter((t) => t.createdBy === user?.id) : topics
    return [...filtered].sort((a, b) =>
      sortBy === 'name'
        ? a.name.localeCompare(b.name)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [topics, sortBy, createdByMeOnly, user?.id])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [topics, sortBy, createdByMeOnly])

  const visibleTopics = filteredSortedTopics.slice(0, visibleCount)
  const remainingCount = filteredSortedTopics.length - visibleTopics.length

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
      const created = await api.createTopic(newName.trim(), newDescription.trim() || undefined, newIsPrivate, newInvitedUserIds)
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
      setNewInvitedUserIds([])
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
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={!newIsPrivate}
                onChange={(e) => setNewIsPrivate(!e.target.checked)}
                className="w-4 h-4 rounded border-2 border-stone-900 accent-fuchsia-500"
              />
              Public (shared with all friends)
            </label>
            <p className="text-xs text-stone-400 mt-1 ml-6">
              Uncheck this to share with specific people instead.
            </p>
          </div>
          {newIsPrivate && (
            <div>
              <div className="text-sm font-semibold text-stone-700 mb-2">Share with</div>
              <FriendPicker selectedIds={newInvitedUserIds} onChange={setNewInvitedUserIds} />
            </div>
          )}
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

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="input-field w-auto py-1.5"
          >
            <option value="updatedAt">Last updated</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={createdByMeOnly}
            onChange={(e) => setCreatedByMeOnly(e.target.checked)}
            className="w-4 h-4 rounded border-2 border-stone-900 accent-fuchsia-500"
          />
          Created by me
        </label>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : topics.length === 0 ? (
        <p className="text-stone-500 text-sm">No topics yet. Create the first one.</p>
      ) : filteredSortedTopics.length === 0 ? (
        <p className="text-stone-500 text-sm">No topics match this filter.</p>
      ) : (
        <ul className="space-y-3">
          {visibleTopics.map((t) => (
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

      {remainingCount > 0 && (
        <div className="flex justify-center mt-4">
          <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className="btn-link">
            Load {Math.min(remainingCount, PAGE_SIZE)} more
          </button>
        </div>
      )}
    </div>
  )
}
