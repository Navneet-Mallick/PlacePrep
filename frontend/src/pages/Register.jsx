import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    password: '',
    password_confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      await api.post('/auth/register/', formData)
      navigate('/login')
    } catch (err) {
      setErrors(err.response?.data || { general: 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Create account</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username" name="username" value={formData.username} onChange={handleChange} error={errors.username} placeholder="johndoe" />
          <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
          <Field label="Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John Doe" required={false} />
          <Field label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Min 8 characters" />
          <Field label="Confirm password" name="password_confirm" type="password" value={formData.password_confirm} onChange={handleChange} error={errors.password_confirm} placeholder="••••••••" />

          {errors.general && (
            <p className="text-sm text-red-400">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-white text-neutral-900 text-sm font-medium rounded-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, placeholder, required = true }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
