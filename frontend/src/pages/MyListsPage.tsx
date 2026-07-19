import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ListSummary } from '../types'
import ErrorBanner from '../components/ErrorBanner'

export default function MyListsPage() {
  const [lists, setLists] = useState<ListSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getMyLists()
      .then(setLists)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your lists.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <h1 className="text-xl font-bold mb-4">My Lists</h1>
      <ErrorBanner message={error} />
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : lists.length === 0 ? (
        <p className="text-slate-500 text-sm">
          You haven't started a list yet. Open a topic and create one from the Lists tab.
        </p>
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
                  {l.description && <div className="text-sm text-slate-500">{l.description}</div>}
                </div>
                <div className="text-sm text-slate-400">{l.entries.length} item{l.entries.length === 1 ? '' : 's'}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
