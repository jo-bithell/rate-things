import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
    isActive
      ? 'bg-fuchsia-500 text-white border-stone-900'
      : 'text-stone-600 border-transparent hover:border-stone-900 hover:bg-amber-100'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 text-center py-2 text-xs font-bold ${isActive ? 'text-fuchsia-600' : 'text-stone-500'}`

export default function NavBar() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <>
      {/* Top bar: visible on all sizes, full nav links from sm up */}
      <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur border-b-2 border-stone-900">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/topics" className="font-display font-bold text-lg text-fuchsia-600 flex items-center gap-1.5">
            <span className="inline-block animate-[wiggle_2.5s_ease-in-out_infinite]">⭐</span> RateThings
          </NavLink>
          <nav className="hidden sm:flex items-center gap-2">
            <NavLink to="/topics" className={linkClass}>Topics</NavLink>
            <NavLink to="/account" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                {user.imageUrl && (
                  <img src={user.imageUrl} alt="" className="w-5 h-5 rounded-full border border-stone-900 object-cover" />
                )}
                Account
              </span>
            </NavLink>
            <button onClick={logout} className="px-3 py-2 rounded-full text-sm font-semibold text-stone-600 hover:bg-amber-100 border-2 border-transparent hover:border-stone-900 transition-colors">
              Log out
            </button>
          </nav>
        </div>
      </header>

      {/* Bottom tab bar: mobile only */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-10 bg-amber-50 border-t-2 border-stone-900 flex">
        <NavLink to="/topics" className={mobileLinkClass}>Topics</NavLink>
        <NavLink to="/account" className={mobileLinkClass}>Account</NavLink>
        <button onClick={logout} className="flex-1 text-center py-2 text-xs font-bold text-stone-500">
          Log out
        </button>
      </nav>
    </>
  )
}
