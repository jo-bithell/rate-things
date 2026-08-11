import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../api/client'
import type { PendingUser } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setPending(await api.getPendingUsers())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pending accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'Admin') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  const handleApprove = async (id: string) => {
    if (busyId) return
    setBusyId(id)
    setError(null)
    try {
      await api.approveUser(id)
      setPending((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve account.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (busyId) return
    if (!confirm(`Reject ${name}'s account? This deletes it permanently.`)) return
    setBusyId(id)
    setError(null)
    try {
      await api.rejectUser(id)
      setPending((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject account.')
    } finally {
      setBusyId(null)
    }
  }

  if (user?.role !== 'Admin') {
    return <div className="p-6 text-center text-stone-500">You don't have permission to view this page.</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <h1 className="text-2xl font-display font-bold mb-6">Admin</h1>

      <ErrorBanner message={error} />

      <h2 className="font-display font-bold mb-3">Pending accounts ({pending.length})</h2>
      {loading ? (
        <LoadingSpinner />
      ) : pending.length === 0 ? (
        <p className="text-stone-500 text-sm">No accounts awaiting approval.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 border-2 border-stone-200 rounded-xl p-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{u.displayName}</div>
                <div className="text-xs text-stone-400 truncate">{u.email}</div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => handleApprove(u.id)} disabled={busyId === u.id} className="btn-link disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => handleReject(u.id, u.displayName)} disabled={busyId === u.id} className="btn-danger-link disabled:opacity-50">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
