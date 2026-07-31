import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import ScoreInput from '../components/ScoreInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ImageUploader from '../components/ImageUploader'

export default function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [savingRating, setSavingRating] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingRating, setRemovingRating] = useState(false)

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
    if (!entityId || savingRating) return
    if (score === null && !comment.trim()) {
      setError('Give a score, a comment, or both.')
      return
    }
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
    if (!entityId || removingRating) return
    setRemovingRating(true)
    try {
      const updated = await api.deleteRating(entityId)
      setEntity(updated)
      setScore(null)
      setComment('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove rating.')
    } finally {
      setRemovingRating(false)
    }
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!entityId || !editName.trim() || savingEdit) return
    setSavingEdit(true)
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
    } finally {
      setSavingEdit(false)
    }
  }

  const handleUploadImage = async (file: File) => {
    if (!entityId) return
    setEntity(await api.uploadEntityImage(entityId, file))
  }

  const handleRemoveImage = async () => {
    if (!entityId) return
    setEntity(await api.deleteEntityImage(entityId))
  }

  const handleDelete = async () => {
    if (!entityId || !entity || deleting) return
    if (!confirm(`Delete "${entity.name}"? This can't be undone.`)) return
    setDeleting(true)
    try {
      await api.deleteEntity(entityId)
      navigate(`/topics/${entity.topicId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete entity.')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!entity) return <div className="p-6 text-center text-stone-500">Entity not found.</div>

  const isOwner = user?.id === entity.createdBy

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to={`/topics/${entity.topicId}`} className="text-sm font-semibold text-fuchsia-600">&larr; Back to topic</Link>

      <ErrorBanner message={error} />

      <div className="flex items-start justify-between mt-2 gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{entity.name}</h1>
          {entity.description && <p className="text-stone-500 text-sm mt-1">{entity.description}</p>}
          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entity.tags.map((t) => (
                <span key={t} className="pill-tag">{t}</span>
              ))}
            </div>
          )}
          <div className="text-xs text-stone-400 mt-2">Added by {entity.createdByName}</div>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="score-badge text-lg w-14 h-14">{entity.ratingCount > 0 ? entity.avgRating.toFixed(1) : '—'}</div>
          <div className="text-xs text-stone-400">{entity.ratingCount} rating{entity.ratingCount === 1 ? '' : 's'}</div>
        </div>
      </div>

      {isOwner && (
        <div className="mt-3 flex gap-4">
          <button onClick={() => setEditing((v) => !v)} className="btn-link">
            {editing ? 'Cancel edit' : 'Edit'}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger-link disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}

      {isOwner && (
        <div className="mt-3">
          <ImageUploader
            imageUrl={entity.imageUrl}
            alt={entity.name}
            placeholder="🖼️"
            onUpload={handleUploadImage}
            onRemove={handleRemoveImage}
          />
        </div>
      )}

      {editing && (
        <form onSubmit={handleEdit} className="card mt-3 space-y-3">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
          <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="input-field" />
          <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Tags, comma separated" className="input-field" />
          <button type="submit" disabled={savingEdit} className="btn-primary">{savingEdit ? 'Saving…' : 'Save'}</button>
        </form>
      )}

      <div className="card mt-6">
        <h2 className="font-display font-bold mb-3">Your rating or comment</h2>
        <form onSubmit={handleRate} className="space-y-3">
          <ScoreInput value={score} onChange={setScore} />
          <textarea
            placeholder={score === null ? 'Add a comment (a score is optional)' : 'Add a short note (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field text-sm"
            rows={2}
          />
          <div className="flex items-center gap-4">
            <button type="submit" disabled={savingRating} className="btn-primary">
              {savingRating ? 'Saving…' : score === null ? 'Save comment' : 'Save rating'}
            </button>
            {entity.ratings.some((r) => r.userId === user?.id) && (
              <button type="button" onClick={handleRemoveRating} disabled={removingRating} className="btn-danger-link disabled:opacity-50">
                {removingRating ? 'Removing…' : 'Remove mine'}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="font-display font-bold mb-3">Ratings &amp; comments ({entity.ratings.length})</h2>
        {entity.ratings.length === 0 ? (
          <p className="text-stone-500 text-sm">No ratings or comments yet.</p>
        ) : (
          <ul className="space-y-2">
            {entity.ratings
              .slice()
              .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
              .map((r) => (
                <li key={r.userId} className="card py-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 min-w-0">
                      <img
                        src={r.userImageUrl || '/default-avatar.svg'}
                        alt=""
                        className="w-6 h-6 rounded-full border border-stone-900 object-cover shrink-0"
                      />
                      <span className="font-semibold text-sm truncate">{r.userName}</span>
                    </span>
                    {r.score !== null && (
                      <span className="font-display font-bold text-fuchsia-600 shrink-0">{r.score}/10</span>
                    )}
                  </div>
                  {r.comment && <p className="text-sm text-stone-500 mt-1">{r.comment}</p>}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
