import { useState } from 'react'
import { resumeAPI } from '../services/api'

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
        suggestions: data.suggestions,
      })
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not upload resume.')
    } finally {
      setLoading(false)
    }
  }

  const rec = result?.recommendations || {}
  const hasRecommendations = rec && Object.keys(rec).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload your resume for NLP-based entity extraction, role prediction, and scoring.
        </p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-5">
        <label className="block text-xs font-medium text-gray-400 mb-2">Resume file (PDF or DOCX)</label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-400 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 dark:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-white file:cursor-pointer hover:file:bg-neutral-700"
          />
        </div>
        {file && <p className="mt-2 text-xs text-gray-500">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
        <button
          type="submit"
          disabled={loading || !file}
          className="mt-4 w-full py-2.5 bg-white text-gray-900 text-sm font-medium rounded-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md border border-red-900 bg-red-950/50">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-3xl font-bold text-white mt-1">{result.resume_score}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <p className="text-xs text-gray-500">Predicted Role</p>
              <p className="text-sm font-semibold text-white mt-1">{result.predicted_role}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <p className="text-xs text-gray-500">Confidence</p>
              <p className="text-3xl font-bold text-white mt-1">{(result.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* Entities */}
          {result.entities && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-5 space-y-4">
              <h2 className="text-sm font-medium text-gray-300">Extracted Information</h2>
              
              {result.entities.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Skills ({result.entities.skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.entities.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-zinc-800 text-gray-300 border border-neutral-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <EntityList label="Education" items={result.entities.education} />
                <EntityList label="Experience" items={result.entities.experience} />
                <EntityList label="Certifications" items={result.entities.certifications} />
                <EntityList label="Organizations" items={result.entities.organizations} />
              </div>

              {result.entities.email?.length > 0 && (
                <p className="text-xs text-gray-500">Contact: {result.entities.email.join(', ')}</p>
              )}
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-5">
              <h2 className="text-sm font-medium text-gray-300 mb-3">Suggestions</h2>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-400">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommendations */}
          {hasRecommendations && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-5 space-y-3">
              <h2 className="text-sm font-medium text-gray-300">AI Recommendations</h2>
              {rec.summary && <p className="text-sm text-gray-400">{rec.summary}</p>}
              {rec.missing_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.missing_skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-950 text-amber-300 border border-amber-900">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {rec.focus_areas?.length > 0 && <ListSection label="Focus Areas" items={rec.focus_areas} />}
              {rec.next_steps?.length > 0 && <ListSection label="Next Steps" items={rec.next_steps} />}
            </div>
          )}

          {!hasRecommendations && (
            <p className="text-xs text-gray-600">AI recommendations unavailable (Gemini API quota may be exhausted).</p>
          )}
        </div>
      )}
    </div>
  )
}

function EntityList({ label, items }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <ul className="space-y-0.5">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="text-sm text-gray-400 truncate">{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ListSection({ label, items }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-400">{item}</li>
        ))}
      </ul>
    </div>
  )
}
