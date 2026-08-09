import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
      : 'text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
  }`

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/resume', label: 'Resume' },
        { to: '/aptitude', label: 'Aptitude' },
        { to: '/technical', label: 'Technical' },
        { to: '/practice', label: 'Practice' },
      ]
    : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">PlacementPrep</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    {user?.first_name || user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg">
                    Log in
                  </NavLink>
                  <NavLink to="/register" className="btn-primary !text-sm !py-1.5 !px-3.5">
                    Sign up
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-[#0a0a0a] px-4 py-4 space-y-1">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-zinc-300'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
              {isAuthenticated ? (
                <>
                  <p className="px-3 text-xs text-gray-400 dark:text-zinc-500">
                    {user?.first_name || user?.username}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white text-center"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">P</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">PlacementPrep</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-zinc-400">
              <Link to="/resume" className="hover:text-gray-900 dark:hover:text-white">Resume</Link>
              <Link to="/aptitude" className="hover:text-gray-900 dark:hover:text-white">Aptitude</Link>
              <Link to="/technical" className="hover:text-gray-900 dark:hover:text-white">Technical</Link>
              <Link to="/practice" className="hover:text-gray-900 dark:hover:text-white">Practice</Link>
              <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
            </nav>
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              &copy; 2026 Navneet Mallick
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
