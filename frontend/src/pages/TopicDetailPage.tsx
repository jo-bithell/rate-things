import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity, ListSummary, Topic } from '../types'
import ErrorBanner from '../components/ErrorBanner'

type Tab = 'entities' | 'lists'

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const { user } = useAuth()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [tab, setTab] = useState<Tab>('entities')

  const [entities, setEntities] = useState<Entity[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showCreateEntity, setShowCreateEntity] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityDescription, setNewEntityDescription] = useState('')
  const [newEntityTags, setNewEntityTags] = useState('')

  const [lists, setLists] = useState<ListSummary[]>([])
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEntities = async (search?: string, tag?: string | null) => {
    if (!topicId) return
    const [entityResults, tagResults] = await Promise.all([
      api.getEntities(topicId, search, tag ?? undefined),
      api.getEntityTags(topicId),
    ])
    setEntities(entityResults)
    setTags(tagResults)
  }

  const loadLists = async () => {
    if (!topicId) return
    setLists(await api.getListsByTopic(topicId))
  }

  useEffect(() => {
    if (!topicId) return
    setLoading(true)
    Promise.all([api.getTopic(topicId), loadEntities(), loadLists()])
      .then(([t]) => setTopic(t))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load topic.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    loadEntities(search, activeTag)
  }

  const toggleTag = (tag: string) => {
    const next = activeTag === tag ? null : tag
    setActiveTag(next)
    loadEntities(search, next)
  }

  const handleCreateEntity = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicId || !newEntityName.trim()) return
    setError(null)
    try {
      await api.createEntity(
        topicId,
        newEntityName.trim(),
        newEntityDescription.trim() || undefined,
        newEntityTags.split(',').map((t) => t.trim()).filter(Boolean),
      )
      setNewEntityName('')
      setNewEntityDescription('')
      setNewEntityTags('')
      setShowCreateEntity(false)
      loadEntities(search, activeTag)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create entity.')
    }
  }

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicId || !newListName.trim()) return
    setError(null)
    try {
      await api.createList(topicId, newListName.trim())
      setNewListName('')
      setShowCreateList(false)
      loadLists()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create list.')
    }
  }

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>
  if (!topic) return <div className="p-6 text-center text-slate-500">Topic not found.</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to="/topics" className="text-sm text-indigo-600">&larr; All topics</Link>
      <h1 className="text-xl font-bold mt-2">{topic.name}</h1>
      {topic.description && <p className="text-slate-500 text-sm mt-1">{topic.description}</p>}

      <ErrorBanner message={error} />

      <div className="flex gap-2 mt-4 border-b border-slate-200">
        <button
          onClick={() => setTab('entities')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'entities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Entities
        </button>
        <button
          onClick={() => setTab('lists')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'lists' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Lists
        </button>
      </div>

      {tab === 'entities' && (
        <div className="mt-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowCreateEntity((v) => !v)}
              className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700"
            >
              {showCreateEntity ? 'Cancel' : '+ Add entity'}
            </button>
          </div>

          {showCreateEntity && (
            <form onSubmit={handleCreateEntity} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
              <input
                placeholder="Name (e.g. Inception)"
                required
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Description (optional)"
                value={newEntityDescription}
                onChange={(e) => setNewEntityDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Tags, comma separated (e.g. sci-fi, thriller)"
                value={newEntityTags}
                onChange={(e) => setNewEntityTags(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <p className="text-xs text-slate-400">
                Search first — each entity should exist once per topic. If it's already here, rate it instead of re-adding it.
              </p>
              <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700">
                Add entity
              </button>
            </form>
          )}

          <form onSubmit={handleSearch} className="mb-3">
            <input
              placeholder="Search entities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </form>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    activeTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {entities.length === 0 ? (
            <p className="text-slate-500 text-sm">No entities yet. Add the first one.</p>
          ) : (
            <ul className="space-y-2">
              {entities.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/entities/${e.id}`}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-400"
                  >
                    <div>
                      <div className="font-semibold">{e.name}</div>
                      {e.tags.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">{e.tags.join(', ')}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600">{e.ratingCount > 0 ? e.avgRating.toFixed(1) : '—'}<span className="text-xs text-slate-400">/10</span></div>
                      <div className="text-xs text-slate-400">{e.ratingCount} rating{e.ratingCount === 1 ? '' : 's'}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'lists' && (
        <div className="mt-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowCreateList((v) => !v)}
              className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700"
            >
              {showCreateList ? 'Cancel' : '+ New list'}
            </button>
          </div>

          {showCreateList && (
            <form onSubmit={handleCreateList} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
              <input
                placeholder={`List name (e.g. "${user?.displayName ?? 'My'}'s Top 10")`}
                required
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700">
                Create list
              </button>
            </form>
          )}

          {lists.length === 0 ? (
            <p className="text-slate-500 text-sm">No lists yet for this topic. Start one.</p>
          ) : (
            <ul className="space-y-2">
              {lists.map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/lists/${l.id}`}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-400"
                  >
                    <div>
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-xs text-slate-400 mt-1">by {l.ownerName}</div>
                    </div>
                    <div className="text-sm text-slate-400">{l.entries.length} item{l.entries.length === 1 ? '' : 's'}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
