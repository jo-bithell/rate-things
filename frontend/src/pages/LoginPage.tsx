import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import ErrorBanner from '../components/ErrorBanner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(displayName, password)
      navigate('/topics')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-display font-bold text-center text-fuchsia-600 mb-6">⭐ RateThings</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label htmlFor="login-display-name" className="block text-sm font-semibold text-stone-700 mb-1">Display name</label>
            <input
              id="login-display-name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="text-center text-sm text-stone-500 mt-4">
          No account? <Link to="/register" className="text-fuchsia-600 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  )
}
