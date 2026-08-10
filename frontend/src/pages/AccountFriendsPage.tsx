import FriendsManager from '../components/FriendsManager'

export default function AccountFriendsPage() {
  return (
    <div className="card">
      <p className="text-sm text-stone-500 mb-4">
        Friends can see your public topics, and any private topics you specifically share with them.
      </p>
      <FriendsManager />
    </div>
  )
}
