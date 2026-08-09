import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', first_name: '', password: '', password_confirm: '' })
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
      setErrors(err.response?.data || { general: 'Registration failed' })
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
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Create an account</h1>
          <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Get started with PlacementPrep</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username" name="username" value={formData.username} onChange={handleChange} error={errors.username} placeholder="johndoe" />
          <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
          <Field label="Full Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John Doe" required={false} />
          <Field label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Min 8 characters" />
          <Field label="Confirm Password" name="password_confirm" type="password" value={formData.password_confirm} onChange={handleChange} error={errors.password_confirm} placeholder="••••••••" />

          {errors.general && <p className="text-[13px] text-red-500">{errors.general}</p>}

          <button type="submit" disabled={loading}
            className="btn-primary w-full !mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-500 dark:text-zinc-400">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, placeholder, required = true }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}
