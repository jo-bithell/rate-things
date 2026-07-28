import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity, ListSummary, Topic } from '../types'
import ErrorBanner from '../components/ErrorBanner'

type Tab = 'entities' | 'lists'

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [tab, setTab] = useState<Tab>('entities')

  const [editingTopic, setEditingTopic] = useState(false)
  const [editTopicName, setEditTopicName] = useState('')
  const [editTopicDescription, setEditTopicDescription] = useState('')
  const [savingTopic, setSavingTopic] = useState(false)

  const [entities, setEntities] = useState<Entity[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showCreateEntity, setShowCreateEntity] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityDescription, setNewEntityDescription] = useState('')
  const [newEntityTags, setNewEntityTags] = useState('')
  const [creatingEntity, setCreatingEntity] = useState(false)

  const [lists, setLists] = useState<ListSummary[]>([])
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)

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

  useEffect(() => {
    if (topic) {
      setEditTopicName(topic.name)
      setEditTopicDescription(topic.description ?? '')
    }
  }, [topic])

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
    if (!topicId || !newEntityName.trim() || creatingEntity) return
    setError(null)
    setCreatingEntity(true)
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
      await loadEntities(search, activeTag)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create entity.')
    } finally {
      setCreatingEntity(false)
    }
  }

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicId || !newListName.trim() || creatingList) return
    setError(null)
    setCreatingList(true)
    try {
      await api.createList(topicId, newListName.trim())
      setNewListName('')
      setShowCreateList(false)
      await loadLists()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create list.')
    } finally {
      setCreatingList(false)
    }
  }

  const handleEditTopic = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicId || !editTopicName.trim() || savingTopic) return
    setError(null)
    setSavingTopic(true)
    try {
      const updated = await api.updateTopic(topicId, editTopicName.trim(), editTopicDescription.trim() || undefined)
      setTopic(updated)
      setEditingTopic(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update topic.')
    } finally {
      setSavingTopic(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!topicId || !topic) return
    if (!confirm(`Delete "${topic.name}"? This removes the topic but not its entities or lists.`)) return
    try {
      await api.deleteTopic(topicId)
      navigate('/topics')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete topic.')
    }
  }

  if (loading) return <div className="p-6 text-center text-stone-500">Loading…</div>
  if (!topic) return <div className="p-6 text-center text-stone-500">Topic not found.</div>

  const isOwner = user?.id === topic.createdBy

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to="/topics" className="text-sm font-semibold text-fuchsia-600">&larr; All topics</Link>

      <div className="flex items-start justify-between mt-2 gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{topic.name}</h1>
          {topic.description && <p className="text-stone-500 text-sm mt-1">{topic.description}</p>}
        </div>
        {isOwner && (
          <div className="text-sm shrink-0 flex gap-3">
            <button onClick={() => setEditingTopic((v) => !v)} className="btn-link">{editingTopic ? 'Cancel' : 'Edit'}</button>
            <button onClick={handleDeleteTopic} className="btn-danger-link">Delete</button>
          </div>
        )}
      </div>

      {editingTopic && (
        <form onSubmit={handleEditTopic} className="card mt-3 space-y-3">
          <input value={editTopicName} onChange={(e) => setEditTopicName(e.target.value)} className="input-field" />
          <input value={editTopicDescription} onChange={(e) => setEditTopicDescription(e.target.value)} placeholder="Description" className="input-field" />
          <button type="submit" disabled={savingTopic} className="btn-primary">{savingTopic ? 'Saving…' : 'Save'}</button>
        </form>
      )}

      <ErrorBanner message={error} />

      <div className="flex gap-2 mt-4 border-b-2 border-stone-200">
        <button
          onClick={() => setTab('entities')}
          className={`px-3 py-2 text-sm font-bold border-b-4 -mb-0.5 ${tab === 'entities' ? 'border-fuchsia-500 text-fuchsia-600' : 'border-transparent text-stone-500'}`}
        >
          Entities
        </button>
        <button
          onClick={() => setTab('lists')}
          className={`px-3 py-2 text-sm font-bold border-b-4 -mb-0.5 ${tab === 'lists' ? 'border-fuchsia-500 text-fuchsia-600' : 'border-transparent text-stone-500'}`}
        >
          Lists
        </button>
      </div>

      {tab === 'entities' && (
        <div className="mt-4">
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowCreateEntity((v) => !v)} className="btn-primary">
              {showCreateEntity ? 'Cancel' : '+ Add entity'}
            </button>
          </div>

          {showCreateEntity && (
            <form onSubmit={handleCreateEntity} className="card mb-4 space-y-3">
              <input
                placeholder="Name (e.g. Inception)"
                required
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                className="input-field"
              />
              <input
                placeholder="Description (optional)"
                value={newEntityDescription}
                onChange={(e) => setNewEntityDescription(e.target.value)}
                className="input-field"
              />
              <input
                placeholder="Tags, comma separated (e.g. sci-fi, thriller)"
                value={newEntityTags}
                onChange={(e) => setNewEntityTags(e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-stone-400">
                Search first — each entity should exist once per topic. If it's already here, rate it instead of re-adding it.
              </p>
              <button type="submit" disabled={creatingEntity} className="btn-primary">
                {creatingEntity ? 'Adding…' : 'Add entity'}
              </button>
            </form>
          )}

          <form onSubmit={handleSearch} className="mb-3">
            <input
              placeholder="Search entities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </form>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`pill ${activeTag === tag ? 'bg-fuchsia-500 text-white' : 'bg-white text-stone-600 hover:bg-amber-100'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {entities.length === 0 ? (
            <p className="text-stone-500 text-sm">No entities yet. Add the first one.</p>
          ) : (
            <ul className="space-y-3">
              {entities.map((e) => (
                <li key={e.id}>
                  <Link to={`/entities/${e.id}`} className="card-link flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{e.name}</div>
                      {e.tags.length > 0 && (
                        <div className="text-xs text-stone-400 mt-1">{e.tags.join(', ')}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="score-badge text-sm">{e.ratingCount > 0 ? e.avgRating.toFixed(1) : '—'}</div>
                      <div className="text-[10px] text-stone-400">{e.ratingCount} rating{e.ratingCount === 1 ? '' : 's'}</div>
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
            <button onClick={() => setShowCreateList((v) => !v)} className="btn-primary">
              {showCreateList ? 'Cancel' : '+ New list'}
            </button>
          </div>

          {showCreateList && (
            <form onSubmit={handleCreateList} className="card mb-4 space-y-3">
              <input
                placeholder={`List name (e.g. "${user?.displayName ?? 'My'}'s Top 10")`}
                required
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="input-field"
              />
              <button type="submit" disabled={creatingList} className="btn-primary">
                {creatingList ? 'Creating…' : 'Create list'}
              </button>
            </form>
          )}

          {lists.length === 0 ? (
            <p className="text-stone-500 text-sm">No lists yet for this topic. Start one.</p>
          ) : (
            <ul className="space-y-3">
              {lists.map((l) => (
                <li key={l.id}>
                  <Link to={`/lists/${l.id}`} className="card-link flex items-center justify-between">
                    <div>
                      <div className="font-bold">{l.name}</div>
                      <div className="text-xs text-stone-400 mt-1">by {l.ownerName}</div>
                    </div>
                    <div className="text-sm text-stone-400">{l.entries.length} item{l.entries.length === 1 ? '' : 's'}</div>
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
