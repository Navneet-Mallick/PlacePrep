import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, resumeAPI, aptitudeAPI, technicalAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState({
    resume: [],
    aptitude: [],
    technical: [],
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      const [statsRes, resumeRes, aptitudeRes, technicalRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        resumeAPI.list(),
        aptitudeAPI.getHistory(),
        technicalAPI.getHistory(),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      setHistory({
        resume: resumeRes.status === 'fulfilled' ? (resumeRes.value.data.results || resumeRes.value.data || []) : [],
        aptitude: aptitudeRes.status === 'fulfilled' ? (aptitudeRes.value.data.results || aptitudeRes.value.data || []) : [],
        technical: technicalRes.status === 'fulfilled' ? (technicalRes.value.data.results || technicalRes.value.data || []) : [],
      })
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-900 bg-red-950/50 p-4">
        <p className="text-sm text-red-300">{error}</p>
        <button onClick={loadDashboardData} className="mt-3 text-xs text-red-400 hover:text-red-300 underline">
          Retry
        </button>
      </div>
    )
  }

  const totalTests = history.aptitude.length + history.technical.length
  const resumeScore = stats?.resume_score ?? stats?.recent_resume?.resume_score ?? null
  const predictedRole = stats?.predicted_role ?? stats?.recent_resume?.predicted_role ?? null
  const aptitudeLatest = stats?.latest_aptitude_attempt || (history.aptitude.length > 0 ? history.aptitude[0] : null)
  const techAvg = stats?.technical_score ?? (
    history.technical.length > 0
      ? Math.round(history.technical.reduce((sum, t) => sum + (t.score || 0), 0) / history.technical.length)
      : null
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
          Overview for {user?.first_name || user?.username || 'you'}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Resume Score"
          value={resumeScore !== null ? `${resumeScore}%` : '—'}
          sub={predictedRole || 'Upload a resume'}
        />
        <MetricCard
          label="Aptitude"
          value={aptitudeLatest ? `${aptitudeLatest.total_score}%` : '—'}
          sub={aptitudeLatest?.aptitude_level || 'No tests yet'}
        />
        <MetricCard
          label="Technical Avg"
          value={techAvg !== null ? `${techAvg}%` : '—'}
          sub={`${history.technical.length} answers`}
        />
        <MetricCard
          label="Total Assessments"
          value={totalTests}
          sub="tests completed"
        />
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column - History */}
        <div className="md:col-span-2 space-y-6">
          {/* Aptitude History */}
          <Section title="Aptitude Tests" count={history.aptitude.length} linkTo="/aptitude">
            {history.aptitude.length === 0 ? (
              <EmptyRow text="No aptitude tests taken yet" linkTo="/aptitude" linkText="Take a test" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {history.aptitude.slice(0, 5).map((attempt, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-zinc-200">
                        {attempt.section || 'Mixed'} — {attempt.aptitude_level || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                        {formatDate(attempt.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${scoreColor(attempt.total_score)}`}>
                        {attempt.total_score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Technical History */}
          <Section title="Technical Answers" count={history.technical.length} linkTo="/technical">
            {history.technical.length === 0 ? (
              <EmptyRow text="No technical answers submitted" linkTo="/technical" linkText="Start assessment" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {history.technical.slice(0, 5).map((answer, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="max-w-[70%]">
                      <p className="text-sm text-zinc-200 truncate">
                        {answer.question?.question_text || `Question ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                        {answer.question?.category || 'General'} · {formatDate(answer.created_at)}
                      </p>
                    </div>
                    <p className={`text-lg font-semibold ${scoreColor(answer.score)}`}>
                      {answer.score}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column - Resume & Recommendations */}
        <div className="space-y-6">
          {/* Resume */}
          <Section title="Resume">
            {history.resume.length === 0 ? (
              <EmptyRow text="No resume uploaded" linkTo="/resume" linkText="Upload resume" />
            ) : (
              <div className="space-y-3">
                {history.resume.slice(0, 3).map((resume, i) => (
                  <div key={i} className="p-3 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{resume.predicted_role || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{formatDate(resume.created_at)}</p>
                      </div>
                      <span className={`text-sm font-semibold ${scoreColor(resume.resume_score)}`}>
                        {resume.resume_score}%
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/resume" className="block text-xs text-zinc-500 hover:text-zinc-300">
                  Upload new resume →
                </Link>
              </div>
            )}
          </Section>

          {/* Weak Areas */}
          {stats?.weak_areas && stats.weak_areas.length > 0 && (
            <Section title="Areas to improve">
              <ul className="space-y-2">
                {stats.weak_areas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                    {area}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Recommendations */}
          {stats?.recommendations && stats.recommendations.length > 0 && (
            <Section title="Recommendations">
              <ul className="space-y-2">
                {stats.recommendations.slice(0, 4).map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-zinc-400">
                    {rec.recommendation_text || rec.message || rec}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Quick Links */}
          <Section title="Quick actions">
            <div className="space-y-2">
              <QuickLink to="/resume" text="Upload Resume" />
              <QuickLink to="/aptitude" text="Take Aptitude Test" />
              <QuickLink to="/technical" text="Technical Assessment" />
              <QuickLink to="/practice" text="Practice Coding" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function MetricCard({ label, value, sub }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1.5">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1.5 capitalize">{sub}</p>
    </div>
  )
}

function Section({ title, count, linkTo, children }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {count !== undefined && (
          <span className="text-sm text-gray-400 dark:text-zinc-500">{count} total</span>
        )}
        {linkTo && (
          <Link to={linkTo} className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
            View all →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text, linkTo, linkText }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-zinc-500">{text}</p>
      {linkTo && (
        <Link to={linkTo} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          {linkText} →
        </Link>
      )}
    </div>
  )
}

function QuickLink({ to, text }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg"
    >
      {text}
    </Link>
  )
}

function scoreColor(score) {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  } catch {
    return dateStr
  }
}
