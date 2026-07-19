import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity, ListSummary } from '../types'
import ErrorBanner from '../components/ErrorBanner'

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [list, setList] = useState<ListSummary | null>(null)
  const [entitiesById, setEntitiesById] = useState<Record<string, Entity>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const [addSearch, setAddSearch] = useState('')

  const load = async () => {
    if (!listId) return
    setLoading(true)
    try {
      const l = await api.getList(listId)
      setList(l)
      const topicEntities = await api.getEntities(l.topicId)
      setEntitiesById(Object.fromEntries(topicEntities.map((e) => [e.id, e])))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  useEffect(() => {
    if (list) {
      setEditName(list.name)
      setEditDescription(list.description ?? '')
    }
  }, [list])

  const orderedEntries = useMemo(
    () => (list ? [...list.entries].sort((a, b) => a.position - b.position) : []),
    [list],
  )

  const isOwner = user?.id === list?.ownerId

  const persistOrder = async (entityIds: string[]) => {
    if (!listId) return
    try {
      setList(await api.replaceListEntries(listId, entityIds))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update list.')
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const ids = orderedEntries.map((e) => e.entityId)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    persistOrder(ids)
  }

  const removeEntry = (entityId: string) => {
    const ids = orderedEntries.map((e) => e.entityId).filter((id) => id !== entityId)
    persistOrder(ids)
  }

  const addEntry = (entityId: string) => {
    const ids = [...orderedEntries.map((e) => e.entityId), entityId]
    persistOrder(ids)
    setAddSearch('')
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!listId || !editName.trim()) return
    try {
      setList(await api.updateList(listId, editName.trim(), editDescription.trim() || undefined))
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update list.')
    }
  }

  const handleDelete = async () => {
    if (!listId || !list) return
    if (!confirm(`Delete "${list.name}"? This can't be undone.`)) return
    try {
      await api.deleteList(listId)
      navigate(`/topics/${list.topicId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete list.')
    }
  }

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>
  if (!list) return <div className="p-6 text-center text-slate-500">List not found.</div>

  const candidateEntities = Object.values(entitiesById)
    .filter((e) => !orderedEntries.some((entry) => entry.entityId === e.id))
    .filter((e) => e.name.toLowerCase().includes(addSearch.toLowerCase()))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to={`/topics/${list.topicId}`} className="text-sm text-indigo-600">&larr; Back to topic</Link>

      <ErrorBanner message={error} />

      <div className="flex items-start justify-between mt-2">
        <div>
          <h1 className="text-xl font-bold">{list.name}</h1>
          {list.description && <p className="text-slate-500 text-sm mt-1">{list.description}</p>}
          <div className="text-xs text-slate-400 mt-1">by {list.ownerName}</div>
        </div>
        {isOwner && (
          <div className="text-sm shrink-0 ml-4 space-x-3">
            <button onClick={() => setEditing((v) => !v)} className="text-indigo-600">{editing ? 'Cancel' : 'Edit'}</button>
            <button onClick={handleDelete} className="text-red-600">Delete</button>
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={handleEdit} className="bg-white border border-slate-200 rounded-lg p-4 mt-3 space-y-3">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700">Save</button>
        </form>
      )}

      <div className="mt-6">
        <h2 className="font-semibold mb-3">Entries</h2>
        {orderedEntries.length === 0 ? (
          <p className="text-slate-500 text-sm">No entries yet. Add some below.</p>
        ) : (
          <ol className="space-y-2">
            {orderedEntries.map((entry, index) => {
              const e = entitiesById[entry.entityId]
              return (
                <li key={entry.entityId} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm w-5">{index + 1}</span>
                    <div>
                      <Link to={`/entities/${entry.entityId}`} className="font-medium hover:text-indigo-600">
                        {e?.name ?? 'Unknown entity'}
                      </Link>
                      {e && <span className="text-xs text-slate-400 ml-2">{e.ratingCount > 0 ? `${e.avgRating.toFixed(1)}/10` : 'unrated'}</span>}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <button onClick={() => move(index, -1)} disabled={index === 0} className="disabled:opacity-30">▲</button>
                      <button onClick={() => move(index, 1)} disabled={index === orderedEntries.length - 1} className="disabled:opacity-30">▼</button>
                      <button onClick={() => removeEntry(entry.entityId)} className="text-red-500 ml-1">✕</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {isOwner && (
        <div className="mt-6">
          <h2 className="font-semibold mb-3">Add from this topic</h2>
          <input
            placeholder="Search entities to add…"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 mb-2"
          />
          {addSearch && (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {candidateEntities.length === 0 ? (
                <li className="text-sm text-slate-400">No matches. You can create a new entity from the topic's Entities tab.</li>
              ) : (
                candidateEntities.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => addEntry(e.id)}
                      className="w-full text-left bg-white border border-slate-200 rounded-md px-3 py-2 hover:border-indigo-400 text-sm"
                    >
                      {e.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
