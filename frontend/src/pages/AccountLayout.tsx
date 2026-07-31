import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
    isActive
      ? 'bg-fuchsia-500 text-white border-stone-900'
      : 'text-stone-600 border-transparent hover:border-stone-900 hover:bg-amber-100'
  }`

export default function AccountLayout() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <h1 className="text-2xl font-display font-bold mb-6">Account</h1>

      <nav className="flex items-center gap-2 mb-6 border-b-2 border-stone-900 pb-4">
        <NavLink to="/account/settings" className={tabClass} end>Settings</NavLink>
        <NavLink to="/account/friends" className={tabClass} end>Friends</NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
