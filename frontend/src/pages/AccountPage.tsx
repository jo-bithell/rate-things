import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import ErrorBanner from '../components/ErrorBanner'
import ImageUploader from '../components/ImageUploader'
import FriendsManager from '../components/FriendsManager'

export default function AccountPage() {
  const { user, updateProfile, changePassword, deleteAccount, uploadProfileImage, removeProfileImage } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !displayName.trim() || savingProfile) return
    setProfileError(null)
    setProfileMessage(null)
    setSavingProfile(true)
    try {
      await updateProfile(email.trim(), displayName.trim())
      setProfileMessage('Profile updated.')
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || savingPassword) return
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.")
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password changed.')
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault()
    if (!deletePassword || deleting) return
    if (!confirm('Delete your account? This cannot be undone. Topics, entities, and lists you created will stay in place but will no longer be linked to you.')) return
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      navigate('/login')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete account.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <h1 className="text-2xl font-display font-bold mb-6">Account</h1>

      <section className="mb-10">
        <h2 className="text-lg font-display font-bold text-fuchsia-600 mb-4">Account settings</h2>
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-display font-bold mb-3">Profile</h3>
            <ErrorBanner message={profileError} />
            {profileMessage && <p className="text-sm text-emerald-700 mb-3">{profileMessage}</p>}
            <div className="mb-4">
              <ImageUploader
                imageUrl={user?.imageUrl}
                alt={user?.displayName ?? 'Profile picture'}
                shape="circle"
                onUpload={uploadProfileImage}
                onRemove={removeProfileImage}
              />
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Display name</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="font-display font-bold mb-3">Change password</h3>
            <ErrorBanner message={passwordError} />
            {passwordMessage && <p className="text-sm text-emerald-700 mb-3">{passwordMessage}</p>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Current password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
                <p className="text-xs text-stone-400 mt-1">At least 8 characters.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword ? 'Saving…' : 'Change password'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
            <h3 className="font-display font-bold mb-1 text-rose-700">Danger zone</h3>
            <p className="text-sm text-rose-700 mb-3">
              Deleting your account is permanent. Topics, entities, and lists you created will stay in place but will no longer be linked to you.
            </p>
            <ErrorBanner message={deleteError} />
            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Confirm your password</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={deleting}
                className="bg-rose-600 text-white text-sm font-semibold px-4 py-2 rounded-full border-2 border-stone-900 shadow-pop hover:bg-rose-500 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-display font-bold text-fuchsia-600 mb-4">Friends</h2>
        <div className="card">
          <p className="text-sm text-stone-500 mb-4">
            Friends can see topics you publish that aren't marked private.
          </p>
          <FriendsManager />
        </div>
      </section>
    </div>
  )
}
