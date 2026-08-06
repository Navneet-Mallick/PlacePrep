import { useState } from 'react'
import { resumeAPI } from '../services/api'

function RecommendationSection({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="font-medium text-white">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function EntityExtraction({ entities }) {
  if (!entities) return null
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Extracted Information</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {entities.email && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-sm text-white">{entities.email}</p>
          </div>
        )}
        {entities.phone && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-xs text-slate-400">Phone</p>
            <p className="text-sm text-white">{entities.phone}</p>
          </div>
        )}
      </div>
      
      {entities.skills && entities.skills.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
          <p className="text-xs text-slate-400 mb-2">Skills ({entities.skills.length})</p>
          <div className="flex flex-wrap gap-2">
            {entities.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-indigo-900/30 px-3 py-1 text-xs text-indigo-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {entities.education && entities.education.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
          <p className="text-xs text-slate-400 mb-2">Education</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {entities.education.map((edu, i) => (
              <li key={i}>• {edu}</li>
            ))}
          </ul>
        </div>
      )}
      
      {entities.certifications && entities.certifications.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
          <p className="text-xs text-slate-400 mb-2">Certifications</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {entities.certifications.map((cert, i) => (
              <li key={i}>• {cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    if (!file) {
      setError('Please choose a PDF or DOCX file.')
      setLoading(false)
      return
    }

    try {
      const { data } = await resumeAPI.upload(file)
      setResult({
        resume_score: data.resume_score,
        predicted_role: data.predicted_role,
        confidence: data.role_confidence,
        entities: data.extracted_entities,
        recommendations: data.recommendations,
      })
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
        err.message || 
        'Could not upload resume. Ensure you are logged in and the backend server is running.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const rec = result?.recommendations

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analysis</h1>
        <p className="mt-2 text-slate-400">
          Upload a resume for role prediction, entity extraction, and AI-powered recommendations. Results are saved to your dashboard.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Upload Resume (PDF or DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-500"
            />
            {file && (
              <p className="mt-2 text-sm text-slate-400">Selected: {file.name}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Resume...
              </span>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-100">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6">
              <p className="text-sm text-indigo-200">Resume Score</p>
              <p className="mt-2 text-4xl font-bold text-indigo-100">{result.resume_score}/100</p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                  style={{ width: `${result.resume_score}%` }}
                ></div>
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-6">
              <p className="text-sm text-purple-200">Predicted Role</p>
              <p className="mt-2 text-2xl font-bold text-purple-100">{result.predicted_role}</p>
              <p className="text-xs text-purple-300 mt-2">Match Score</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-6">
              <p className="text-sm text-green-200">Confidence</p>
              <p className="mt-2 text-4xl font-bold text-green-100">
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Extracted Entities */}
          {result.entities && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <EntityExtraction entities={result.entities} />
            </div>
          )}

          {/* Gemini Recommendations */}
          {rec && Object.keys(rec).length > 0 && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">AI-Powered Recommendations</h2>
              {rec.summary && <p className="text-slate-200 leading-relaxed">{rec.summary}</p>}
              {rec.predicted_role_fit && (
                <div className="rounded-lg border border-indigo-400/30 bg-indigo-900/30 p-3">
                  <p className="text-sm text-indigo-200">{rec.predicted_role_fit}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <RecommendationSection title="🎯 Missing Skills" items={rec.missing_skills} />
                <RecommendationSection title="📚 Recommended Topics" items={rec.recommended_topics} />
                <RecommendationSection title="✏️ Resume Improvements" items={rec.resume_improvements} />
                <RecommendationSection title="🛤️ Learning Path" items={rec.learning_path} />
                <RecommendationSection title="🎓 Practice Focus" items={rec.practice_focus} />
              </div>
              {rec.error && (
                <p className="text-sm text-amber-300">
                  ℹ️ Gemini note: {rec.error}. Check your API plan and retry.
                </p>
              )}
            </div>
          )}
          {!rec || Object.keys(rec).length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-slate-400">No AI recommendations available. The recommendation service may be disabled or experiencing issues.</p>
            </div>
          )}

          {/* Raw JSON */}
          <details className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <summary className="cursor-pointer text-white font-medium hover:text-slate-300">
              📊 View Full Analysis JSON
            </summary>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
