import { useEffect, useState } from 'react'
import { dashboardAPI, resumeAPI, aptitudeAPI, technicalAPI } from '../services/api'

export default function Dashboard() {
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
      const [statsRes, resumeRes, aptitudeRes, technicalRes] = await Promise.all([
        dashboardAPI.getStats(),
        resumeAPI.list(),
        aptitudeAPI.getHistory(),
        technicalAPI.getHistory(),
      ])

      setStats(statsRes.data)
      setHistory({
        resume: resumeRes.data.results || [],
        aptitude: aptitudeRes.data.results || [],
        technical: technicalRes.data.results || [],
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-red-100">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your Placement Prep Dashboard</h1>
        <p className="mt-2 text-slate-400">Track your progress and identify areas for improvement.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats?.resume_score !== null && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6">
            <p className="text-sm text-indigo-200">Resume Score</p>
            <p className="mt-2 text-4xl font-bold text-indigo-100">{stats?.resume_score ?? 'N/A'}</p>
            <p className="text-xs text-indigo-300 mt-2">{stats?.predicted_role ?? 'No role predicted'}</p>
          </div>
        )}

        {stats?.latest_aptitude_attempt && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-6">
            <p className="text-sm text-purple-200">Aptitude Score</p>
            <p className="mt-2 text-4xl font-bold text-purple-100">{stats.latest_aptitude_attempt.total_score}</p>
            <p className="text-xs text-purple-300 mt-2 capitalize">{stats.latest_aptitude_attempt.aptitude_level}</p>
          </div>
        )}

        {stats?.technical_score !== undefined && (
          <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-6">
            <p className="text-sm text-green-200">Technical Avg</p>
            <p className="mt-2 text-4xl font-bold text-green-100">{stats.technical_score.toFixed(0)}</p>
            <p className="text-xs text-green-300 mt-2">Average score</p>
          </div>
        )}

        <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-6">
          <p className="text-sm text-orange-200">Tests Completed</p>
          <p className="mt-2 text-4xl font-bold text-orange-100">
            {(history.aptitude.length + history.technical.length)}
          </p>
          <p className="text-xs text-orange-300 mt-2">Total assessments</p>
        </div>
      </div>

      {/* Weak Areas */}
      {stats?.weak_areas && stats.weak_areas.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">⚠️ Areas to Improve</h2>
          <div className="space-y-2">
            {stats.weak_areas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 text-red-200">
                <span className="inline-block w-2 h-2 bg-red-400 rounded-full"></span>
                {area}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Resume */}
      {stats?.recent_resume && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">📄 Latest Resume Analysis</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Score</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white">{stats.recent_resume.resume_score}</p>
                <p className="text-slate-400">/100</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Predicted Role</p>
              <p className="text-lg font-semibold text-indigo-200">{stats.recent_resume.predicted_role}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Uploaded</p>
              <p className="text-sm text-slate-300">
                {new Date(stats.recent_resume.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aptitude History */}
      {history.aptitude.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">🎯 Recent Aptitude Tests</h2>
          <div className="space-y-3">
            {history.aptitude.slice(0, 3).map((attempt, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div>
                  <p className="font-medium text-white">Test {i + 1}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(attempt.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{attempt.total_score}</p>
                  <p className="text-xs text-slate-400 capitalize">{attempt.aptitude_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Answers History */}
      {history.technical.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">⚙️ Recent Technical Answers</h2>
          <div className="space-y-3">
            {history.technical.slice(0, 3).map((answer, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div>
                  <p className="font-medium text-white line-clamp-1">
                    {answer.question?.question_text || `Question ${i + 1}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {answer.question?.category || 'Technical'} · {new Date(answer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    answer.score >= 70 ? 'text-green-200' :
                    answer.score >= 50 ? 'text-yellow-200' :
                    'text-red-200'
                  }`}>{answer.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {stats?.recommendations && stats.recommendations.length > 0 && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">💡 Personalized Recommendations</h2>
          <div className="space-y-3">
            {stats.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 text-indigo-200 text-sm">
                <span className="flex-shrink-0 text-indigo-400">→</span>
                <span>{rec.recommendation_text || rec.message || rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!stats?.recent_resume && history.aptitude.length === 0 && history.technical.length === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center">
          <p className="text-2xl mb-2">🚀</p>
          <p className="text-slate-300 font-medium">Get Started with Your Placement Prep</p>
          <p className="text-slate-400 text-sm mt-2">Upload a resume, take aptitude tests, or solve technical questions to see your progress here.</p>
        </div>
      )}
    </div>
  )
}
