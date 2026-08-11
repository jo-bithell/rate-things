import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import ErrorBanner from '../components/ErrorBanner'

export default function RegisterPage() {
  const { register } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      setSuccessMessage(await register(password, displayName))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-display font-bold text-fuchsia-600 mb-6">⭐ RateThings</h1>
          <div className="card">
            <p className="text-stone-700">{successMessage}</p>
          </div>
          <p className="text-center text-sm text-stone-500 mt-4">
            <Link to="/login" className="text-fuchsia-600 font-semibold">Log in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-display font-bold text-center text-fuchsia-600 mb-6">⭐ RateThings</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label htmlFor="register-display-name" className="block text-sm font-semibold text-stone-700 mb-1">Display name</label>
            <input
              id="register-display-name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-stone-400 mt-1">This is what you'll log in with — must be unique.</p>
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-stone-400 mt-1">At least 8 characters.</p>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-stone-500 mt-4">
          Already have an account? <Link to="/login" className="text-fuchsia-600 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  )
}
