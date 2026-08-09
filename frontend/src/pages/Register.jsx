import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', password: '', password_confirm: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.post('/auth/register/', formData)
      navigate('/login')
    } catch (err) {
      setErrors(err.response?.data || { general: 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">PlacementPrep</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-sm text-gray-700 dark:text-zinc-300 mt-1.5">
            Free forever. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="johndoe"
            autoComplete="username"
          />
          <Field
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Full name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="John Doe"
            required={false}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="At least 8 characters"
            hint="Use a mix of letters, numbers and symbols"
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            name="password_confirm"
            type="password"
            value={formData.password_confirm}
            onChange={handleChange}
            error={errors.password_confirm}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          {errors.general && (
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700 dark:text-zinc-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, hint, placeholder, required = true, autoComplete }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
        {label}
        {!required && (
          <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-zinc-500">optional</span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full ${error ? 'border-red-300 dark:border-red-700' : ''}`}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
