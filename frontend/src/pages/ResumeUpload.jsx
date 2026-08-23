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

    if (!file) {
      setError('Choose a PDF or DOCX file first.')
      return
    }

    setLoading(true)
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
      setError(err.response?.data?.error || err.message || 'Could not analyze resume.')
    } finally {
      setLoading(false)
    }
  }

  const rec = result?.recommendations || {}
  const hasRecommendations = Object.keys(rec).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Analysis</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
          Upload your resume (PDF or DOCX) to get a detailed breakdown of your profile.
        </p>
      </div>

      {/* Upload */}
      <form onSubmit={handleSubmit} className="card">
        <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-3">
          Resume file (PDF or DOCX)
        </label>

        <label className="flex items-center justify-center gap-3 px-4 py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="text-center">
            {file ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                  {(file.size / 1024).toFixed(0)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Click to select a file</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-600">PDF or DOCX, up to 5 MB</p>
              </>
            )}
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || !file}
          className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze resume'}
        </button>
      </form>

      {/* Analyzing state */}
      {loading && (
        <div className="card text-center py-10">
          <div className="w-8 h-8 border-3 border-gray-200 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base font-medium text-gray-900 dark:text-white">Analyzing your resume...</p>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">Processing your resume, please wait</p>
        </div>
      )}

      {/* Success confirmation */}
      {result && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Resume analyzed successfully — results below
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <p className="text-sm text-gray-700 dark:text-zinc-300 mb-1.5">Resume score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.resume_score}<span className="text-sm text-gray-400 dark:text-zinc-600">/100</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Completeness &amp; detail</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-700 dark:text-zinc-300 mb-1.5">Best match role</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1.5">{result.predicted_role}</p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Predicted from resume content</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-700 dark:text-zinc-300 mb-1.5">Role match</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(result.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                {result.confidence >= 0.5 ? 'Strong specialist' : result.confidence >= 0.3 ? 'Good fit' : 'Generalist profile'}
              </p>
            </div>
          </div>

          {/* Entities */}
          {result.entities && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extracted Information</h2>

              {/* Person name */}
              {result.entities.person?.length > 0 && (
                <div>
                  <p className="section-label mb-1">Name</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{result.entities.person[0]}</p>
                </div>
              )}

              {/* Skills */}
              {result.entities.skills?.length > 0 && (
                <div>
                  <p className="section-label mb-2">
                    Skills ({result.entities.skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.entities.skills.map((skill) => (
                      <span key={skill} className="badge badge-blue">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {result.entities.education?.length > 0 && (
                <div>
                  <p className="section-label mb-2">Education</p>
                  <ul className="space-y-2">
                    {result.entities.education.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                        <span className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Experience */}
              {result.entities.experience?.length > 0 && (
                <div>
                  <p className="section-label mb-2">Experience</p>
                  <ul className="space-y-2">
                    {result.entities.experience.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>
                        <span className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certifications */}
              {result.entities.certifications?.length > 0 && (
                <div>
                  <p className="section-label mb-2">Certifications</p>
                  <ul className="space-y-2">
                    {result.entities.certifications.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-1.5 flex-shrink-0">•</span>
                        <span className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional details - only show if reliable */}
              {/* Organizations/Locations/Dates hidden - unreliable on real PDF text */}

              {/* Contact info */}
              {result.entities.email?.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="font-medium">Contact:</span> {result.entities.email.join(', ')}
                  {result.entities.phone?.length > 0 && ` · ${result.entities.phone[0]}`}
                </p>
              )}
            </div>
          )}

          {/* AI recommendations */}
          {hasRecommendations ? (
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recommendations</h2>

              {rec.summary && (
                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{rec.summary}</p>
              )}

              {rec.missing_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-700 dark:text-zinc-300 mb-2">Missing skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.missing_skills.map((s, i) => (
                      <span key={i} className="badge badge-amber">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                <EntityList label="Focus areas" items={rec.focus_areas} />
                <EntityList label="Next steps" items={rec.next_steps} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-zinc-600">
              Recommendations unavailable at this time.
            </p>
          )}

          {/* Raw JSON Analysis */}
          <details className="card !p-0 overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
              View full JSON analysis
            </summary>
            <div className="border-t border-gray-200 dark:border-zinc-800 px-6 py-4 max-h-96 overflow-auto">
              <pre className="text-xs font-mono text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

function EntityList({ label, items }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="section-label mb-2">{label}</p>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed">{item}</li>
        ))}
      </ul>
    </div>
  )
}
