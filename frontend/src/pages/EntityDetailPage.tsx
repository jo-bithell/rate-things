import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import ScoreInput from '../components/ScoreInput'

export default function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [savingRating, setSavingRating] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')

  const load = async () => {
    if (!entityId) return
    setLoading(true)
    try {
      setEntity(await api.getEntity(entityId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load entity.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId])

  useEffect(() => {
    if (entity) {
      const mine = entity.ratings.find((r) => r.userId === user?.id)
      if (mine) {
        setScore(mine.score)
        setComment(mine.comment ?? '')
      }
      setEditName(entity.name)
      setEditDescription(entity.description ?? '')
      setEditTags(entity.tags.join(', '))
    }
  }, [entity, user])

  const handleRate = async (e: FormEvent) => {
    e.preventDefault()
    if (!entityId) return
    setSavingRating(true)
    setError(null)
    try {
      const updated = await api.upsertRating(entityId, score, comment.trim() || undefined)
      setEntity(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save rating.')
    } finally {
      setSavingRating(false)
    }
  }

  const handleRemoveRating = async () => {
    if (!entityId) return
    try {
      const updated = await api.deleteRating(entityId)
      setEntity(updated)
      setScore(5)
      setComment('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove rating.')
    }
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!entityId || !editName.trim()) return
    try {
      const updated = await api.updateEntity(
        entityId,
        editName.trim(),
        editDescription.trim() || undefined,
        editTags.split(',').map((t) => t.trim()).filter(Boolean),
      )
      setEntity(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update entity.')
    }
  }

  const handleDelete = async () => {
    if (!entityId || !entity) return
    if (!confirm(`Delete "${entity.name}"? This can't be undone.`)) return
    try {
      await api.deleteEntity(entityId)
      navigate(`/topics/${entity.topicId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete entity.')
    }
  }

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>
  if (!entity) return <div className="p-6 text-center text-slate-500">Entity not found.</div>

  const isOwner = user?.id === entity.createdBy

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to={`/topics/${entity.topicId}`} className="text-sm text-indigo-600">&larr; Back to topic</Link>

      <ErrorBanner message={error} />

      <div className="flex items-start justify-between mt-2">
        <div>
          <h1 className="text-xl font-bold">{entity.name}</h1>
          {entity.description && <p className="text-slate-500 text-sm mt-1">{entity.description}</p>}
          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entity.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{t}</span>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-400 mt-2">Added by {entity.createdByName}</div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-2xl font-bold text-indigo-600">{entity.ratingCount > 0 ? entity.avgRating.toFixed(1) : '—'}</div>
          <div className="text-xs text-slate-400">{entity.ratingCount} rating{entity.ratingCount === 1 ? '' : 's'}</div>
        </div>
      </div>

      {isOwner && (
        <div className="mt-3">
          <button onClick={() => setEditing((v) => !v)} className="text-sm text-indigo-600 mr-4">
            {editing ? 'Cancel edit' : 'Edit'}
          </button>
          <button onClick={handleDelete} className="text-sm text-red-600">Delete</button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleEdit} className="bg-white border border-slate-200 rounded-lg p-4 mt-3 space-y-3">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Tags, comma separated" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700">Save</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4 mt-6">
        <h2 className="font-semibold mb-3">Your rating</h2>
        <form onSubmit={handleRate} className="space-y-3">
          <ScoreInput value={score} onChange={setScore} />
          <textarea
            placeholder="Add a short note (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-3">
            <button type="submit" disabled={savingRating} className="bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {savingRating ? 'Saving…' : 'Save rating'}
            </button>
            {entity.ratings.some((r) => r.userId === user?.id) && (
              <button type="button" onClick={handleRemoveRating} className="text-sm text-red-600">Remove my rating</button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-3">All ratings ({entity.ratingCount})</h2>
        {entity.ratings.length === 0 ? (
          <p className="text-slate-500 text-sm">No one has rated this yet.</p>
        ) : (
          <ul className="space-y-2">
            {entity.ratings
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((r) => (
                <li key={r.userId} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{r.userName}</span>
                    <span className="font-bold text-indigo-600">{r.score}/10</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-500 mt-1">{r.comment}</p>}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
