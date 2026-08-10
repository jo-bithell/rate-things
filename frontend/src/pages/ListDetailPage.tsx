import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Entity, ListEntry, ListSummary } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'

function SortableEntry({
  entry,
  index,
  entity,
  isOwner,
  reordering,
  onRemove,
}: {
  entry: ListEntry
  index: number
  entity: Entity | undefined
  isOwner: boolean
  reordering: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.entityId,
    disabled: !isOwner || reordering,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="card py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isOwner && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none disabled:opacity-30"
            disabled={reordering}
          >
            ⠿
          </button>
        )}
        <span className="score-badge w-7 h-7 text-xs bg-fuchsia-100 border-fuchsia-300">{index + 1}</span>
        <div>
          <Link to={`/entities/${entry.entityId}`} className="font-semibold hover:text-fuchsia-600">
            {entity?.name ?? 'Unknown entity'}
          </Link>
          {entity && <span className="text-xs text-stone-400 ml-2">{entity.ratingCount > 0 ? `${entity.avgRating.toFixed(1)}/10` : 'unrated'}</span>}
        </div>
      </div>
      {isOwner && (
        <button onClick={onRemove} disabled={reordering} className="text-rose-500 ml-1 hover:text-rose-700 disabled:opacity-30">✕</button>
      )}
    </li>
  )
}

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
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reordering, setReordering] = useState(false)

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const persistOrder = async (entityIds: string[]) => {
    if (!listId || reordering) return
    setReordering(true)
    try {
      setList(await api.replaceListEntries(listId, entityIds))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update list.')
    } finally {
      setReordering(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || reordering) return
    const ids = orderedEntries.map((e) => e.entityId)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    const reorderedIds = arrayMove(ids, oldIndex, newIndex)
    setList((prev) => (prev ? { ...prev, entries: reorderedIds.map((entityId, position) => ({ entityId, position })) } : prev))
    persistOrder(reorderedIds)
  }

  const removeEntry = (entityId: string) => {
    if (reordering) return
    const ids = orderedEntries.map((e) => e.entityId).filter((id) => id !== entityId)
    persistOrder(ids)
  }

  const addEntry = (entityId: string) => {
    if (reordering) return
    const ids = [...orderedEntries.map((e) => e.entityId), entityId]
    persistOrder(ids)
    setAddSearch('')
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!listId || !editName.trim() || savingEdit) return
    setSavingEdit(true)
    try {
      setList(await api.updateList(listId, editName.trim(), editDescription.trim() || undefined))
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update list.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!listId || !list || deleting) return
    if (!confirm(`Delete "${list.name}"? This can't be undone.`)) return
    setDeleting(true)
    try {
      await api.deleteList(listId)
      navigate(`/topics/${list.topicId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete list.')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!list) return <div className="p-6 text-center text-stone-500">List not found.</div>

  const candidateEntities = Object.values(entitiesById)
    .filter((e) => !orderedEntries.some((entry) => entry.entityId === e.id))
    .filter((e) => e.name.toLowerCase().includes(addSearch.toLowerCase()))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <Link to={`/topics/${list.topicId}`} className="text-sm font-semibold text-fuchsia-600">&larr; Back to topic</Link>

      <ErrorBanner message={error} />

      <div className="flex items-start justify-between mt-2 gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{list.name}</h1>
          {list.description && <p className="text-stone-500 text-sm mt-1">{list.description}</p>}
          <div className="text-xs text-stone-400 mt-1">by {list.ownerName}</div>
        </div>
        {isOwner && (
          <div className="text-sm shrink-0 flex gap-3">
            <button onClick={() => setEditing((v) => !v)} className="btn-link">{editing ? 'Cancel' : 'Edit'}</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger-link disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={handleEdit} className="card mt-3 space-y-3">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
          <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="input-field" />
          <button type="submit" disabled={savingEdit} className="btn-primary">{savingEdit ? 'Saving…' : 'Save'}</button>
        </form>
      )}

      <div className="mt-6">
        <h2 className="font-display font-bold mb-3">Entries</h2>
        {orderedEntries.length === 0 ? (
          <p className="text-stone-500 text-sm">No entries yet. Add some below.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedEntries.map((e) => e.entityId)} strategy={verticalListSortingStrategy}>
              <ol className="space-y-2">
                {orderedEntries.map((entry, index) => (
                  <SortableEntry
                    key={entry.entityId}
                    entry={entry}
                    index={index}
                    entity={entitiesById[entry.entityId]}
                    isOwner={isOwner}
                    reordering={reordering}
                    onRemove={() => removeEntry(entry.entityId)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {isOwner && (
        <div className="mt-6">
          <h2 className="font-display font-bold mb-3">Add from this topic</h2>
          <input
            placeholder="Search entities to add…"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            className="input-field mb-2"
          />
          {addSearch && (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {candidateEntities.length === 0 ? (
                <li className="text-sm text-stone-400">No matches. You can create a new entity from the topic's Entities tab.</li>
              ) : (
                candidateEntities.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => addEntry(e.id)}
                      disabled={reordering}
                      className="w-full text-left bg-white border-2 border-stone-300 rounded-xl px-3 py-2 hover:border-fuchsia-400 text-sm transition-colors disabled:opacity-50"
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
