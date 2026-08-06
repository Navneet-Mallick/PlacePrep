import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
      : 'text-gray-300 hover:text-white hover:bg-gray-800'
  }`

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PP</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                PlacementPrep
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/resume" className={navLinkClass}>
                    Resume
                  </NavLink>
                  <NavLink to="/aptitude" className={navLinkClass}>
                    Aptitude
                  </NavLink>
                  <NavLink to="/technical" className={navLinkClass}>
                    Technical
                  </NavLink>
                  <NavLink to="/practice" className={navLinkClass}>
                    Code Practice
                  </NavLink>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    Welcome, <span className="text-blue-400 font-semibold">{user?.first_name || user?.username}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <NavLink to="/login" className={navLinkClass}>
                    Login
                  </NavLink>
                  <NavLink to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-500/20 bg-slate-900/40 mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">PlacementPrep</h3>
              <p className="text-sm text-gray-400">Unified platform for placement preparation</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Features</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li><a href="#" className="hover:text-blue-400">Resume Analysis</a></li>
                <li><a href="#" className="hover:text-blue-400">Aptitude Tests</a></li>
                <li><a href="#" className="hover:text-blue-400">Technical Assessments</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Resources</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li><a href="#" className="hover:text-blue-400">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-400">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li><a href="#" className="hover:text-blue-400">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-400">Terms</a></li>
                <li><a href="#" className="hover:text-blue-400">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-500/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 PlacementPrep. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
