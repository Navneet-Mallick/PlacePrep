import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-[13px] font-medium ${
    isActive
      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
  }`

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-[1100px] px-6 h-[56px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm shadow-blue-600/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">PlacementPrep</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
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

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              {theme === 'dark' ? (
                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                <span className="hidden sm:block text-[12px] text-gray-500 dark:text-zinc-500">{user?.first_name || user?.username}</span>
                <button onClick={handleLogout}
                  className="px-3 py-1.5 text-[12px] font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="px-3 py-1.5 text-[13px] font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg">
                  Log in
                </NavLink>
                <NavLink to="/register" className="btn-primary text-[13px] !py-1.5 !px-3.5">
                  Sign up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-zinc-800/50 mt-16">
        <div className="mx-auto max-w-[1100px] px-6 py-8 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 dark:text-zinc-600">PlacementPrep &copy; 2026</p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-600">AI-Powered Placement Training Platform</p>
        </div>
      </footer>
    </div>
  )
}
