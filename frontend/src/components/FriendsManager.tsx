import { FormEvent, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Friend, FriendRequest, FriendsResponse, RelationshipStatus, UserSearchResult } from '../types'
import ErrorBanner from './ErrorBanner'
import LoadingSpinner from './LoadingSpinner'

function statusFor(userId: string, r: FriendsResponse): RelationshipStatus {
  if (r.friends.some((f) => f.userId === userId)) return 'friends'
  if (r.outgoing.some((o) => o.userId === userId)) return 'pending_outgoing'
  if (r.incoming.some((i) => i.userId === userId)) return 'pending_incoming'
  return 'none'
}

function Avatar({ imageUrl, name }: { imageUrl?: string; name: string }) {
  return (
    <img
      src={imageUrl || '/default-avatar.svg'}
      alt={name}
      className="w-8 h-8 rounded-full border-2 border-stone-900 object-cover shrink-0"
    />
  )
}

export default function FriendsManager() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const applyResponse = (r: FriendsResponse) => {
    setFriends(r.friends)
    setIncoming(r.incoming)
    setOutgoing(r.outgoing)
  }

  useEffect(() => {
    api
      .getFriends()
      .then(applyResponse)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load friends.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    setError(null)
    try {
      setResults(await api.searchUsers(query.trim()))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId: string) => {
    if (busyId) return
    setBusyId(userId)
    setError(null)
    try {
      const r = await api.sendFriendRequest(userId)
      applyResponse(r)
      setResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationshipStatus: statusFor(userId, r) } : u)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send friend request.')
    } finally {
      setBusyId(null)
    }
  }

  const handleAccept = async (requestId: string) => {
    if (busyId) return
    setBusyId(requestId)
    setError(null)
    try {
      applyResponse(await api.acceptFriendRequest(requestId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept request.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    if (busyId) return
    setBusyId(requestId)
    setError(null)
    try {
      applyResponse(await api.declineFriendRequest(requestId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to decline request.')
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (requestId: string) => {
    if (busyId) return
    setBusyId(requestId)
    setError(null)
    try {
      applyResponse(await api.cancelFriendRequest(requestId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel request.')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (userId: string, name: string) => {
    if (busyId) return
    if (!confirm(`Remove ${name} as a friend? They'll stop seeing your friends-only topics.`)) return
    setBusyId(userId)
    setError(null)
    try {
      applyResponse(await api.removeFriend(userId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove friend.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <ErrorBanner message={error} />

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          placeholder="Search by display name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field"
        />
        <button type="submit" disabled={searching} className="btn-primary shrink-0">
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="space-y-2 mb-4">
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar imageUrl={u.imageUrl} name={u.displayName} />
                <span className="font-semibold text-sm truncate">{u.displayName}</span>
              </div>
              {u.relationshipStatus === 'none' && (
                <button
                  onClick={() => handleSendRequest(u.id)}
                  disabled={busyId === u.id}
                  className="btn-link shrink-0 disabled:opacity-50"
                >
                  {busyId === u.id ? 'Sending…' : 'Add friend'}
                </button>
              )}
              {u.relationshipStatus === 'pending_outgoing' && <span className="text-xs text-stone-400 shrink-0">Requested</span>}
              {u.relationshipStatus === 'pending_incoming' && <span className="text-xs text-stone-400 shrink-0">See requests below</span>}
              {u.relationshipStatus === 'friends' && <span className="text-xs text-stone-400 shrink-0">Already friends</span>}
            </li>
          ))}
        </ul>
      )}

      {incoming.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-700 mb-2">Requests</h3>
          <ul className="space-y-2">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar imageUrl={r.imageUrl} name={r.displayName} />
                  <span className="font-semibold text-sm truncate">{r.displayName}</span>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => handleAccept(r.id)} disabled={busyId === r.id} className="btn-link disabled:opacity-50">
                    Accept
                  </button>
                  <button onClick={() => handleDecline(r.id)} disabled={busyId === r.id} className="btn-danger-link disabled:opacity-50">
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-700 mb-2">Sent requests</h3>
          <ul className="space-y-2">
            {outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar imageUrl={r.imageUrl} name={r.displayName} />
                  <span className="font-semibold text-sm truncate">{r.displayName}</span>
                </div>
                <button onClick={() => handleCancel(r.id)} disabled={busyId === r.id} className="btn-danger-link shrink-0 disabled:opacity-50">
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="text-sm font-bold text-stone-700 mb-2">Your friends ({friends.length})</h3>
      {friends.length === 0 ? (
        <p className="text-stone-500 text-sm">No friends yet — search for someone above.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <li key={f.userId} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar imageUrl={f.imageUrl} name={f.displayName} />
                <span className="font-semibold text-sm truncate">{f.displayName}</span>
              </div>
              <button
                onClick={() => handleRemove(f.userId, f.displayName)}
                disabled={busyId === f.userId}
                className="btn-danger-link shrink-0 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
