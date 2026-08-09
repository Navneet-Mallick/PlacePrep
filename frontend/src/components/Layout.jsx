import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-neutral-800 text-white'
      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50'
  }`

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-sm font-semibold text-neutral-100">PlacementPrep</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                <NavLink to="/resume" className={navLinkClass}>Resume</NavLink>
                <NavLink to="/aptitude" className={navLinkClass}>Aptitude</NavLink>
                <NavLink to="/technical" className={navLinkClass}>Technical</NavLink>
                <NavLink to="/practice" className={navLinkClass}>Practice</NavLink>
              </>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-neutral-500">
                  {user?.first_name || user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 rounded-md"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <NavLink to="/login" className="px-3 py-1.5 text-sm font-medium text-neutral-400 hover:text-white rounded-md">
                  Log in
                </NavLink>
                <NavLink to="/register" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                  Sign up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-20">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-neutral-600">PlacementPrep</p>
          <p className="text-xs text-neutral-600">Built for placement preparation</p>
        </div>
      </footer>
    </div>
  )
}
