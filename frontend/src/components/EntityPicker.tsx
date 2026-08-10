import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Entity } from '../types'
import ErrorBanner from './ErrorBanner'
import LoadingSpinner from './LoadingSpinner'

export default function EntityPicker({
  topicId,
  selectedIds,
  onChange,
}: {
  topicId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getEntities(topicId)
      .then(setEntities)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load entities.'))
      .finally(() => setLoading(false))
  }, [topicId])

  const toggle = (entityId: string) => {
    onChange(selectedIds.includes(entityId) ? selectedIds.filter((id) => id !== entityId) : [...selectedIds, entityId])
  }

  const visibleEntities = entities.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <ErrorBanner message={error} />
      {entities.length === 0 ? (
        <p className="text-stone-500 text-sm">No entities in this topic yet. Add some first.</p>
      ) : (
        <>
          <input
            placeholder="Search entities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field mb-2"
          />
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {visibleEntities.length === 0 ? (
              <li className="text-sm text-stone-400">No matches.</li>
            ) : (
              visibleEntities.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {e.imageUrl && (
                      <img src={e.imageUrl} alt="" className="w-8 h-8 rounded-lg border-2 border-stone-900 object-cover shrink-0" />
                    )}
                    <span className="font-semibold text-sm truncate">{e.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggle(e.id)}
                    className="w-4 h-4 rounded border-2 border-stone-900 accent-fuchsia-500 shrink-0"
                  />
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  )
}
