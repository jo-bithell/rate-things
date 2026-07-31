import FriendsManager from '../components/FriendsManager'

export default function AccountFriendsPage() {
  return (
    <div className="card">
      <p className="text-sm text-stone-500 mb-4">
        Friends can see topics you publish that aren't marked private.
      </p>
      <FriendsManager />
    </div>
  )
}
