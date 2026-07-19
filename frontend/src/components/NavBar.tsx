import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 text-center py-2 text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-500'}`

export default function NavBar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <>
      {/* Top bar: visible on all sizes, full nav links from sm up */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/topics" className="font-bold text-lg text-indigo-600">
            RateThings
          </NavLink>
          <nav className="hidden sm:flex items-center gap-2">
            <NavLink to="/topics" className={linkClass}>Topics</NavLink>
            <NavLink to="/my-lists" className={linkClass}>My Lists</NavLink>
            <span className="text-sm text-slate-500 px-2">{user.displayName}</span>
            <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
              Log out
            </button>
          </nav>
        </div>
      </header>

      {/* Bottom tab bar: mobile only */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-slate-200 flex">
        <NavLink to="/topics" className={mobileLinkClass}>Topics</NavLink>
        <NavLink to="/my-lists" className={mobileLinkClass}>My Lists</NavLink>
        <button onClick={logout} className="flex-1 text-center py-2 text-xs font-medium text-slate-500">
          Log out
        </button>
      </nav>
    </>
  )
}
