import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login/', { email, password })
      const { access, refresh, user } = response.data
      login({ access, refresh }, user || { username: email.split('@')[0], first_name: email.split('@')[0], email })
      navigate(location.state?.from || '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-8">
          <div className="w-10 h-10 mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-600/20 mb-4">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
            <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full !mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-500 dark:text-zinc-400">
          Don't have an account? <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
