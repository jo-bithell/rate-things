import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Friend } from '../types'
import ErrorBanner from './ErrorBanner'
import LoadingSpinner from './LoadingSpinner'

export default function FriendPicker({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getFriends()
      .then((r) => setFriends(r.friends))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load friends.'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (userId: string) => {
    onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId])
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <ErrorBanner message={error} />
      {friends.length === 0 ? (
        <p className="text-stone-500 text-sm">Add some friends first to share with them.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <li key={f.userId} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={f.imageUrl || '/default-avatar.svg'}
                  alt={f.displayName}
                  className="w-8 h-8 rounded-full border-2 border-stone-900 object-cover shrink-0"
                />
                <span className="font-semibold text-sm truncate">{f.displayName}</span>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(f.userId)}
                onChange={() => toggle(f.userId)}
                className="w-4 h-4 rounded border-2 border-stone-900 accent-fuchsia-500 shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
